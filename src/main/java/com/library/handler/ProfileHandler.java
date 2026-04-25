package com.library.handler;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.library.config.DbConfig;
import com.library.util.CorsUtil;
import com.library.util.ResponseUtil;
import com.library.util.SessionManager;
import com.library.util.SessionManager.Session;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.sql.*;

/**
 * Handles GET /api/profile — returns the logged-in member's full profile:
 *  - Personal info
 *  - Currently borrowed books
 *  - Borrowing history
 *  - Total fines paid
 */
public class ProfileHandler implements HttpHandler {

    private final Gson gson = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        CorsUtil.addCorsHeaders(exchange);

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (!"GET".equals(exchange.getRequestMethod().toUpperCase())) {
            ResponseUtil.sendError(exchange, 405, "Method not allowed.");
            return;
        }

        Session session = SessionManager.requireAuth(exchange);
        if (session == null) return;

        // Only members have profiles (admin gets basic info)
        if (session.isAdmin()) {
            JsonObject adminProfile = new JsonObject();
            adminProfile.addProperty("role", "ADMIN");
            adminProfile.addProperty("username", session.getUsername());
            ResponseUtil.sendJson(exchange, 200, gson.toJson(adminProfile));
            return;
        }

        try {
            JsonObject profile = buildMemberProfile(session.getUserId());
            ResponseUtil.sendJson(exchange, 200, gson.toJson(profile));
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, e.getMessage() != null ? e.getMessage() : "Internal server error.");
        }
    }

    private JsonObject buildMemberProfile(String memberUuid) throws SQLException {
        JsonObject profile = new JsonObject();

        try (Connection conn = DbConfig.getConnection()) {
            // 1. Personal info
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, name, email, phone, member_id, joined_at, is_active FROM members WHERE id = ?::uuid")) {
                ps.setString(1, memberUuid);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        profile.addProperty("role",     "MEMBER");
                        profile.addProperty("id",       rs.getString("id"));
                        profile.addProperty("name",     rs.getString("name"));
                        profile.addProperty("email",    rs.getString("email"));
                        profile.addProperty("phone",    rs.getString("phone"));
                        profile.addProperty("memberId", rs.getString("member_id"));
                        Timestamp joinedAt = rs.getTimestamp("joined_at");
                        profile.addProperty("joinedAt", joinedAt != null ? joinedAt.toString() : null);
                        profile.addProperty("isActive", rs.getBoolean("is_active"));
                        
                        if (joinedAt != null) {
                            long diffMillis = (joinedAt.getTime() + 365L * 24 * 60 * 60 * 1000) - System.currentTimeMillis();
                            int days = (int) (diffMillis / (1000 * 60 * 60 * 24));
                            profile.addProperty("expiresInDays", days < 0 ? 0 : days);
                        }
                    }
                }
            }

            // 2. Currently borrowed books (active issues)
            JsonArray activeBooks = new JsonArray();
            try (PreparedStatement ps = conn.prepareStatement("""
                    SELECT t.id, t.issued_at, t.due_date, t.status,
                           b.title, b.author
                    FROM transactions t
                    JOIN books b ON t.book_id = b.id
                    WHERE t.member_id = ?::uuid AND t.status = 'ISSUED'
                    ORDER BY t.due_date ASC
                    """)) {
                ps.setString(1, memberUuid);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        JsonObject book = new JsonObject();
                        book.addProperty("transactionId", rs.getString("id"));
                        book.addProperty("title",    rs.getString("title"));
                        book.addProperty("author",   rs.getString("author"));
                        book.addProperty("issuedAt", rs.getTimestamp("issued_at").toString());
                        book.addProperty("dueDate",  rs.getTimestamp("due_date").toString());
                        book.addProperty("status",   rs.getString("status"));
                        activeBooks.add(book);
                    }
                }
            }
            profile.add("activeBooks", activeBooks);

            // 3. Borrowing history (returned books)
            JsonArray history = new JsonArray();
            try (PreparedStatement ps = conn.prepareStatement("""
                    SELECT t.id, t.issued_at, t.due_date, t.returned_at, t.fine_amount, t.status,
                           b.title, b.author
                    FROM transactions t
                    JOIN books b ON t.book_id = b.id
                    WHERE t.member_id = ?::uuid AND t.status = 'RETURNED'
                    ORDER BY t.returned_at DESC
                    LIMIT 50
                    """)) {
                ps.setString(1, memberUuid);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        JsonObject tx = new JsonObject();
                        tx.addProperty("transactionId", rs.getString("id"));
                        tx.addProperty("title",      rs.getString("title"));
                        tx.addProperty("author",     rs.getString("author"));
                        tx.addProperty("issuedAt",   rs.getTimestamp("issued_at").toString());
                        tx.addProperty("dueDate",    rs.getTimestamp("due_date").toString());
                        Timestamp returnedAt = rs.getTimestamp("returned_at");
                        tx.addProperty("returnedAt", returnedAt != null ? returnedAt.toString() : null);
                        tx.addProperty("fineAmount", rs.getDouble("fine_amount"));
                        tx.addProperty("status",     rs.getString("status"));
                        history.add(tx);
                    }
                }
            }
            profile.add("history", history);

            // 4. Stats
            try (PreparedStatement ps = conn.prepareStatement("""
                    SELECT
                        COUNT(*) FILTER (WHERE status = 'ISSUED') AS active_count,
                        COUNT(*) FILTER (WHERE status = 'RETURNED') AS returned_count,
                        COALESCE(SUM(fine_amount) FILTER (WHERE status = 'RETURNED'), 0) AS total_fines
                    FROM transactions WHERE member_id = ?::uuid
                    """)) {
                ps.setString(1, memberUuid);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        profile.addProperty("activeCount",   rs.getInt("active_count"));
                        profile.addProperty("returnedCount", rs.getInt("returned_count"));
                        profile.addProperty("totalFines",    rs.getDouble("total_fines"));
                    }
                }
            }

            // 5. Reservation Requests
            JsonArray requests = new JsonArray();
            try (PreparedStatement ps = conn.prepareStatement("""
                    SELECT r.*, b.title as book_title
                    FROM book_requests r
                    JOIN books b ON r.book_id = b.id
                    WHERE r.member_id = ?::uuid
                    ORDER BY r.created_at DESC
                    """)) {
                ps.setString(1, memberUuid);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        JsonObject r = new JsonObject();
                        r.addProperty("id", rs.getString("id"));
                        r.addProperty("bookTitle", rs.getString("book_title"));
                        r.addProperty("requestedDays", rs.getInt("requested_days"));
                        r.addProperty("status", rs.getString("status"));
                        r.addProperty("createdAt", rs.getTimestamp("created_at").toString());
                        requests.add(r);
                    }
                }
            }
            profile.add("requests", requests);
        }

        return profile;
    }
}
