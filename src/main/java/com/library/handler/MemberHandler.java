package com.library.handler;

import com.google.gson.Gson;
import com.library.dao.MemberDao;
import com.library.model.Member;
import com.library.util.CorsUtil;
import com.library.util.ResponseUtil;
import com.library.util.SessionManager;
import com.library.util.SessionManager.Session;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Handles all /api/members/* routes:
 *   GET    /api/members         → list all (or ?q=... for search)
 *   GET    /api/members/{id}    → get by ID
 *   POST   /api/members         → register member
 *   PUT    /api/members/{id}    → update member
 *   DELETE /api/members/{id}    → remove member
 */
public class MemberHandler implements HttpHandler {

    private final MemberDao memberDao = new MemberDao();
    private final Gson      gson      = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        CorsUtil.addCorsHeaders(exchange);

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String path     = exchange.getRequestURI().getPath();
        String method   = exchange.getRequestMethod().toUpperCase();
        String rawQuery = exchange.getRequestURI().getRawQuery();

        String[] parts = path.split("/");
        String   id    = (parts.length > 3 && !parts[3].isBlank()) ? parts[3] : null;

        try {
            // Auth check
            Session session = SessionManager.requireAuth(exchange);
            if (session == null) return;

            switch (method) {
                case "GET" -> {
                    if (id == null) {
                        if (rawQuery != null && rawQuery.startsWith("q=")) {
                            String q = URLDecoder.decode(rawQuery.substring(2), StandardCharsets.UTF_8);
                            List<Member> members = memberDao.searchMembers(q);
                            ResponseUtil.sendJson(exchange, 200, gson.toJson(members));
                        } else {
                            List<Member> members = memberDao.getAllMembers();
                            ResponseUtil.sendJson(exchange, 200, gson.toJson(members));
                        }
                    } else {
                        Member member = memberDao.getMemberById(id);
                        if (member == null) ResponseUtil.sendError(exchange, 404, "Member not found.");
                        else                ResponseUtil.sendJson(exchange, 200, gson.toJson(member));
                    }
                }
                case "POST" -> {
                    if (!session.isAdmin()) { ResponseUtil.sendError(exchange, 403, "Admin access required."); return; }
                    String body    = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                    Member member  = gson.fromJson(body, Member.class);
                    Member created = memberDao.addMember(member);
                    ResponseUtil.sendJson(exchange, 201, gson.toJson(created));
                }
                case "PUT" -> {
                    if (!session.isAdmin()) { ResponseUtil.sendError(exchange, 403, "Admin access required."); return; }
                    if (id == null) { ResponseUtil.sendError(exchange, 400, "Member ID is required."); return; }
                    String body    = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                    Member member  = gson.fromJson(body, Member.class);
                    Member updated = memberDao.updateMember(id, member);
                    if (updated == null) ResponseUtil.sendError(exchange, 404, "Member not found.");
                    else                 ResponseUtil.sendJson(exchange, 200, gson.toJson(updated));
                }
                case "DELETE" -> {
                    if (!session.isAdmin()) { ResponseUtil.sendError(exchange, 403, "Admin access required."); return; }
                    if (id == null) { ResponseUtil.sendError(exchange, 400, "Member ID is required."); return; }
                    memberDao.deleteMember(id);
                    ResponseUtil.sendJson(exchange, 200, "{\"message\":\"Member removed successfully.\"}");
                }
                default -> ResponseUtil.sendError(exchange, 405, "Method not allowed.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, e.getMessage() != null ? e.getMessage() : "Internal server error.");
        }
    }
}
