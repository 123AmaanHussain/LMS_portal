package com.library.util;

import com.sun.net.httpserver.HttpExchange;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory session manager.
 * Each session is identified by a UUID token stored in the Authorization header.
 */
public class SessionManager {

    /** Represents a user session. */
    public static class Session {
        private final String token;
        private final String role;       // "ADMIN" or "MEMBER"
        private final String userId;     // UUID from users/members table
        private final String username;   // admin username or member name
        private final String memberId;   // e.g. "LIB-001" (null for admin)

        public Session(String token, String role, String userId, String username, String memberId) {
            this.token    = token;
            this.role     = role;
            this.userId   = userId;
            this.username = username;
            this.memberId = memberId;
        }

        public String getToken()    { return token; }
        public String getRole()     { return role; }
        public String getUserId()   { return userId; }
        public String getUsername() { return username; }
        public String getMemberId() { return memberId; }
        public boolean isAdmin()    { return "ADMIN".equals(role); }
        public boolean isMember()   { return "MEMBER".equals(role); }
    }

    // ─── Session store ────────────────────────────────────────────────────────

    private static final Map<String, Session> SESSIONS = new ConcurrentHashMap<>();

    /** Creates a new session and returns the token. */
    public static Session createSession(String role, String userId, String username, String memberId) {
        String token = UUID.randomUUID().toString();
        Session session = new Session(token, role, userId, username, memberId);
        SESSIONS.put(token, session);
        return session;
    }

    /** Retrieves a session by token (or null if not found). */
    public static Session getSession(String token) {
        return token != null ? SESSIONS.get(token) : null;
    }

    /** Removes a session (logout). */
    public static void removeSession(String token) {
        if (token != null) SESSIONS.remove(token);
    }

    // ─── Helper to extract session from HTTP request ──────────────────────────

    /**
     * Extracts the Bearer token from the Authorization header and returns the session.
     * Returns null if no valid session is found.
     */
    public static Session getSessionFromRequest(HttpExchange exchange) {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring(7).trim();
        return getSession(token);
    }

    /**
     * Requires authentication. Returns the session or sends a 401 error.
     * Returns null if unauthorized (and the response is already sent).
     */
    public static Session requireAuth(HttpExchange exchange) throws java.io.IOException {
        Session session = getSessionFromRequest(exchange);
        if (session == null) {
            ResponseUtil.sendError(exchange, 401, "Unauthorized. Please log in.");
            return null;
        }
        return session;
    }

    /**
     * Requires a specific role. Returns the session or sends a 403 error.
     * Returns null if unauthorized/forbidden (and the response is already sent).
     */
    public static Session requireRole(HttpExchange exchange, String role) throws java.io.IOException {
        Session session = requireAuth(exchange);
        if (session == null) return null;
        if (!role.equals(session.getRole())) {
            ResponseUtil.sendError(exchange, 403, "Access denied. " + role + " role required.");
            return null;
        }
        return session;
    }
}
