package com.library.handler;

import com.google.gson.Gson;
import com.library.dao.BookDao;
import com.library.model.Book;
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
 * Handles all /api/books/* routes:
 *   GET    /api/books         → list all (or ?q=... for search)
 *   GET    /api/books/{id}    → get by ID
 *   POST   /api/books         → create book
 *   PUT    /api/books/{id}    → update book
 *   DELETE /api/books/{id}    → delete book
 */
public class BookHandler implements HttpHandler {

    private final BookDao bookDao = new BookDao();
    private final Gson    gson    = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        CorsUtil.addCorsHeaders(exchange);

        // Handle CORS preflight
        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String path     = exchange.getRequestURI().getPath();        // e.g. /api/books/uuid
        String method   = exchange.getRequestMethod().toUpperCase();
        String rawQuery = exchange.getRequestURI().getRawQuery();

        // Extract optional {id} from path: ["", "api", "books", "{id}"]
        String[] parts = path.split("/");
        String   id    = (parts.length > 3 && !parts[3].isBlank()) ? parts[3] : null;

        try {
            // Auth: GET is open to all logged-in users, write ops need ADMIN
            Session session = SessionManager.requireAuth(exchange);
            if (session == null) return;

            switch (method) {
                case "GET" -> {
                    if (id == null) {
                        if (rawQuery != null && rawQuery.startsWith("q=")) {
                            String q = URLDecoder.decode(rawQuery.substring(2), StandardCharsets.UTF_8);
                            List<Book> books = bookDao.searchBooks(q);
                            ResponseUtil.sendJson(exchange, 200, gson.toJson(books));
                        } else {
                            List<Book> books = bookDao.getAllBooks();
                            ResponseUtil.sendJson(exchange, 200, gson.toJson(books));
                        }
                    } else {
                        Book book = bookDao.getBookById(id);
                        if (book == null) ResponseUtil.sendError(exchange, 404, "Book not found.");
                        else              ResponseUtil.sendJson(exchange, 200, gson.toJson(book));
                    }
                }
                case "POST" -> {
                    if (!session.isAdmin()) { ResponseUtil.sendError(exchange, 403, "Admin access required."); return; }
                    String body    = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                    Book   book    = gson.fromJson(body, Book.class);
                    Book   created = bookDao.addBook(book);
                    ResponseUtil.sendJson(exchange, 201, gson.toJson(created));
                }
                case "PUT" -> {
                    if (!session.isAdmin()) { ResponseUtil.sendError(exchange, 403, "Admin access required."); return; }
                    if (id == null) { ResponseUtil.sendError(exchange, 400, "Book ID is required."); return; }
                    String body    = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                    Book   book    = gson.fromJson(body, Book.class);
                    Book   updated = bookDao.updateBook(id, book);
                    if (updated == null) ResponseUtil.sendError(exchange, 404, "Book not found.");
                    else                 ResponseUtil.sendJson(exchange, 200, gson.toJson(updated));
                }
                case "DELETE" -> {
                    if (!session.isAdmin()) { ResponseUtil.sendError(exchange, 403, "Admin access required."); return; }
                    if (id == null) { ResponseUtil.sendError(exchange, 400, "Book ID is required."); return; }
                    bookDao.deleteBook(id);
                    ResponseUtil.sendJson(exchange, 200, "{\"message\":\"Book deleted successfully.\"}");
                }
                default -> ResponseUtil.sendError(exchange, 405, "Method not allowed.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, e.getMessage() != null ? e.getMessage() : "Internal server error.");
        }
    }
}
