package com.library.handler;

import com.google.gson.Gson;
import com.library.dao.TransactionDao;
import com.library.model.DashboardStats;
import com.library.util.CorsUtil;
import com.library.util.ResponseUtil;
import com.library.util.SessionManager;
import com.library.util.SessionManager.Session;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;

/**
 * Handles GET /api/dashboard — returns aggregated library statistics
 * including total books, members, active issues, overdue count, and recent transactions.
 */
public class DashboardHandler implements HttpHandler {

    private final TransactionDao txDao = new TransactionDao();
    private final Gson           gson  = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        CorsUtil.addCorsHeaders(exchange);

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            ResponseUtil.sendError(exchange, 405, "Method not allowed.");
            return;
        }

        try {
            // Only admin can view dashboard
            Session session = SessionManager.requireRole(exchange, "ADMIN");
            if (session == null) return;

            DashboardStats stats = txDao.getDashboardStats();
            ResponseUtil.sendJson(exchange, 200, gson.toJson(stats));
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, e.getMessage() != null ? e.getMessage() : "Internal server error.");
        }
    }
}
