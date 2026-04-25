package com.library.handler;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.library.dao.AuthDao;
import com.library.util.CorsUtil;
import com.library.util.ResponseUtil;
import com.library.util.SessionManager;
import com.library.util.SessionManager.Session;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Handles authentication routes:
 *   POST /api/auth/login    → login (admin or member)
 *   POST /api/auth/logout   → logout (invalidate session)
 *   GET  /api/auth/me       → get current user info from session
 */
public class AuthHandler implements HttpHandler {

    private final AuthDao authDao = new AuthDao();
    private final Gson    gson    = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        CorsUtil.addCorsHeaders(exchange);

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String path   = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        String[] parts   = path.split("/");
        // parts: ["", "api", "auth", "login|logout|me"]
        String   action  = (parts.length > 3 && !parts[3].isBlank()) ? parts[3] : null;

        try {
            switch (action != null ? action : "") {
                case "login"  -> handleLogin(exchange, method);
                case "logout" -> handleLogout(exchange, method);
                case "me"     -> handleMe(exchange, method);
                default       -> ResponseUtil.sendError(exchange, 404, "Unknown auth endpoint.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, e.getMessage() != null ? e.getMessage() : "Internal server error.");
        }
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    private void handleLogin(HttpExchange exchange, String method) throws Exception {
        if (!"POST".equals(method)) {
            ResponseUtil.sendError(exchange, 405, "Method not allowed. Use POST.");
            return;
        }

        String     body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        JsonObject json = gson.fromJson(body, JsonObject.class);

        String role = json.has("role") ? json.get("role").getAsString().toUpperCase() : "";

        if ("ADMIN".equals(role)) {
            String username = json.has("username") ? json.get("username").getAsString() : "";
            String password = json.has("password") ? json.get("password").getAsString() : "";

            if (username.isBlank() || password.isBlank()) {
                ResponseUtil.sendError(exchange, 400, "Username and password are required.");
                return;
            }

            Map<String, String> user = authDao.authenticateAdmin(username, password);
            if (user == null) {
                ResponseUtil.sendError(exchange, 401, "Invalid admin credentials.");
                return;
            }

            Session session = SessionManager.createSession("ADMIN", user.get("id"), user.get("username"), null);
            sendSessionResponse(exchange, session, null);

        } else if ("MEMBER".equals(role)) {
            String memberId = json.has("memberId") ? json.get("memberId").getAsString() : "";
            String password = json.has("password") ? json.get("password").getAsString() : "";

            if (memberId.isBlank() || password.isBlank()) {
                ResponseUtil.sendError(exchange, 400, "Member ID and password are required.");
                return;
            }

            Map<String, String> member = null;
            try {
                member = authDao.authenticateMember(memberId, password);
            } catch (RuntimeException e) {
                if ("ACCOUNT_SUSPENDED".equals(e.getMessage())) {
                    ResponseUtil.sendError(exchange, 403, "Account Suspended: Please contact the administrator.");
                    return;
                }
                throw e;
            }

            if (member == null) {
                ResponseUtil.sendError(exchange, 401, "Invalid member credentials.");
                return;
            }

            Session session = SessionManager.createSession(
                "MEMBER", member.get("id"), member.get("name"), member.get("memberId")
            );
            sendSessionResponse(exchange, session, member);

        } else {
            ResponseUtil.sendError(exchange, 400, "Invalid role. Use 'ADMIN' or 'MEMBER'.");
        }
    }

    // ─── Logout ───────────────────────────────────────────────────────────────

    private void handleLogout(HttpExchange exchange, String method) throws IOException {
        if (!"POST".equals(method)) {
            ResponseUtil.sendError(exchange, 405, "Method not allowed. Use POST.");
            return;
        }

        Session session = SessionManager.getSessionFromRequest(exchange);
        if (session != null) {
            SessionManager.removeSession(session.getToken());
        }
        ResponseUtil.sendJson(exchange, 200, "{\"message\":\"Logged out successfully.\"}");
    }

    // ─── Get current user ─────────────────────────────────────────────────────

    private void handleMe(HttpExchange exchange, String method) throws IOException {
        if (!"GET".equals(method)) {
            ResponseUtil.sendError(exchange, 405, "Method not allowed. Use GET.");
            return;
        }

        Session session = SessionManager.requireAuth(exchange);
        if (session == null) return;  // 401 already sent

        JsonObject result = new JsonObject();
        result.addProperty("token",    session.getToken());
        result.addProperty("role",     session.getRole());
        result.addProperty("userId",   session.getUserId());
        result.addProperty("username", session.getUsername());
        if (session.getMemberId() != null) {
            result.addProperty("memberId", session.getMemberId());
        }
        ResponseUtil.sendJson(exchange, 200, gson.toJson(result));
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private void sendSessionResponse(HttpExchange exchange, Session session, Map<String, String> extra) throws IOException {
        JsonObject result = new JsonObject();
        result.addProperty("token",    session.getToken());
        result.addProperty("role",     session.getRole());
        result.addProperty("userId",   session.getUserId());
        result.addProperty("username", session.getUsername());
        if (session.getMemberId() != null) {
            result.addProperty("memberId", session.getMemberId());
        }
        if (extra != null) {
            extra.forEach((k, v) -> {
                if (!result.has(k)) result.addProperty(k, v);
            });
        }
        ResponseUtil.sendJson(exchange, 200, gson.toJson(result));
    }
}
