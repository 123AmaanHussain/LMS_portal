package com.library.handler;

import com.google.gson.Gson;
import com.library.dao.RequestDao;
import com.library.dao.TransactionDao;
import com.library.model.BookRequest;
import com.library.util.CorsUtil;
import com.library.util.ResponseUtil;
import com.library.util.SessionManager;
import com.library.util.SessionManager.Session;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class RequestHandler implements HttpHandler {
    private final Gson gson = new Gson();
    private final RequestDao requestDao = new RequestDao();
    private final TransactionDao transactionDao = new TransactionDao();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        CorsUtil.addCorsHeaders(exchange);
        String method = exchange.getRequestMethod().toUpperCase();
        String path = exchange.getRequestURI().getPath();

        if (method.equals("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        Session session = SessionManager.requireAuth(exchange);
        if (session == null) return;

        try {
            if (method.equals("POST") && path.equals("/api/requests")) {
                handleCreateRequest(exchange, session);
            } else if (method.equals("GET") && path.equals("/api/requests")) {
                handleListRequests(exchange, session);
            } else if (method.equals("PUT") && path.endsWith("/approve")) {
                handleApproveRequest(exchange, session);
            } else if (method.equals("PUT") && path.endsWith("/reject")) {
                handleRejectRequest(exchange, session);
            } else {
                ResponseUtil.sendError(exchange, 404, "Not Found");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, e.getMessage());
        }
    }

    private void handleCreateRequest(HttpExchange exchange, Session session) throws IOException {
        if (session.isAdmin()) {
            ResponseUtil.sendError(exchange, 403, "Admins cannot make book requests.");
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        BookRequest req = gson.fromJson(body, BookRequest.class);
        req.setMemberId(session.getUserId());
        
        try {
            requestDao.createRequest(req);
            ResponseUtil.sendJson(exchange, 201, "{\"message\": \"Request submitted successfully.\"}");
        } catch (Exception e) {
            ResponseUtil.sendError(exchange, 400, e.getMessage());
        }
    }

    private void handleListRequests(HttpExchange exchange, Session session) throws IOException {
        try {
            if (session.isAdmin()) {
                ResponseUtil.sendJson(exchange, 200, gson.toJson(requestDao.getPendingRequests()));
            } else {
                ResponseUtil.sendJson(exchange, 200, gson.toJson(requestDao.getRequestsByMember(session.getUserId())));
            }
        } catch (Exception e) {
            ResponseUtil.sendError(exchange, 500, e.getMessage());
        }
    }

    private void handleApproveRequest(HttpExchange exchange, Session session) throws IOException {
        if (!session.isAdmin()) {
            ResponseUtil.sendError(exchange, 403, "Forbidden");
            return;
        }

        String path = exchange.getRequestURI().getPath();
        String id = path.split("/")[3]; // /api/requests/{id}/approve

        try {
            BookRequest req = requestDao.getRequestById(id);
            if (req == null) throw new Exception("Request not found.");
            
            // 1. Issue the book
            transactionDao.issueBook(req.getBookId(), req.getMemberId(), req.getRequestedDays());
            
            // 2. Update request status
            requestDao.updateStatus(id, "APPROVED");
            
            ResponseUtil.sendJson(exchange, 200, "{\"message\": \"Request approved and book issued.\"}");
        } catch (Exception e) {
            ResponseUtil.sendError(exchange, 400, e.getMessage());
        }
    }

    private void handleRejectRequest(HttpExchange exchange, Session session) throws IOException {
        if (!session.isAdmin()) {
            ResponseUtil.sendError(exchange, 403, "Forbidden");
            return;
        }

        String path = exchange.getRequestURI().getPath();
        String id = path.split("/")[3];

        try {
            requestDao.updateStatus(id, "REJECTED");
            ResponseUtil.sendJson(exchange, 200, "{\"message\": \"Request rejected.\"}");
        } catch (Exception e) {
            ResponseUtil.sendError(exchange, 400, e.getMessage());
        }
    }
}
