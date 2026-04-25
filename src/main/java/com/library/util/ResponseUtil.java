package com.library.util;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Sends JSON HTTP responses with correct Content-Type and encoding. */
public class ResponseUtil {

    public static void sendJson(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    public static void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
        // Escape double-quotes and newlines in the error message
        String safe = message.replace("\\", "\\\\").replace("\"", "'").replace("\n", " ");
        sendJson(exchange, statusCode, "{\"error\":\"" + safe + "\"}");
    }
}
