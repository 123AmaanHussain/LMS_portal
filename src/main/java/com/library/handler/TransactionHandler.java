package com.library.handler;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.library.dao.TransactionDao;
import com.library.model.Transaction;
import com.library.util.CorsUtil;
import com.library.util.ResponseUtil;
import com.library.util.SessionManager;
import com.library.util.SessionManager.Session;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Handles all /api/transactions/* routes:
 *   GET  /api/transactions          → all transactions (last 200)
 *   GET  /api/transactions/active   → currently issued books
 *   GET  /api/transactions/overdue  → overdue books
 *   POST /api/transactions/issue    → issue a book { bookId, memberId }
 *   POST /api/transactions/return   → return a book { transactionId }
 */
public class TransactionHandler implements HttpHandler {

    private final TransactionDao txDao = new TransactionDao();
    private final Gson           gson  = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        CorsUtil.addCorsHeaders(exchange);

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String path    = exchange.getRequestURI().getPath();   // /api/transactions[/subpath]
        String method  = exchange.getRequestMethod().toUpperCase();

        // Extract sub-path: ["", "api", "transactions", "issue"]
        String[] parts   = path.split("/");
        String   subPath = (parts.length > 3 && !parts[3].isBlank()) ? parts[3] : null;

        try {
            // Auth check
            Session session = SessionManager.requireAuth(exchange);
            if (session == null) return;

            if ("GET".equals(method)) {
                List<Transaction> result;
                if (subPath == null)             result = txDao.getAllTransactions();
                else if ("active".equals(subPath))  result = txDao.getActiveTransactions();
                else if ("overdue".equals(subPath)) result = txDao.getOverdueTransactions();
                else { ResponseUtil.sendError(exchange, 404, "Unknown endpoint."); return; }
                ResponseUtil.sendJson(exchange, 200, gson.toJson(result));

            } else if ("POST".equals(method)) {
                // Only admin can issue/return books
                if (!session.isAdmin()) { ResponseUtil.sendError(exchange, 403, "Admin access required."); return; }
                String     body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                JsonObject json = gson.fromJson(body, JsonObject.class);

                if ("issue".equals(subPath)) {
                    if (!json.has("bookId") || !json.has("memberId")) {
                        ResponseUtil.sendError(exchange, 400, "Missing bookId or memberId.");
                        return;
                    }
                    String bookId   = json.get("bookId").getAsString();
                    String memberId = json.get("memberId").getAsString();
                    Transaction tx  = txDao.issueBook(bookId, memberId);
                    ResponseUtil.sendJson(exchange, 201, gson.toJson(tx));

                } else if ("return".equals(subPath)) {
                    if (!json.has("transactionId")) {
                        ResponseUtil.sendError(exchange, 400, "Missing transactionId.");
                        return;
                    }
                    String transactionId = json.get("transactionId").getAsString();
                    Transaction tx       = txDao.returnBook(transactionId);
                    ResponseUtil.sendJson(exchange, 200, gson.toJson(tx));

                } else {
                    ResponseUtil.sendError(exchange, 404, "Unknown endpoint. Use /issue or /return.");
                }
            } else {
                ResponseUtil.sendError(exchange, 405, "Method not allowed.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, e.getMessage() != null ? e.getMessage() : "Internal server error.");
        }
    }
}
