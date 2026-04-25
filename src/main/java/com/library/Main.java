package com.library;

import com.library.config.EnvLoader;
import com.library.config.MigrationRunner;
import com.library.handler.*;
import com.sun.net.httpserver.*;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

/**
 * Entry point for the Library Management System REST API.
 * Reads the server port from environment variables (.env).
 */
public class Main {

    private static final int PORT = Integer.parseInt(EnvLoader.get("PORT", "9090"));

    public static void main(String[] args) throws IOException {
        // Run database migrations on startup
        MigrationRunner.run();

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 100);

        // Auth routes (public — no token required)
        server.createContext("/api/auth",         new AuthHandler());

        // Protected API routes (token required)
        server.createContext("/api/books",        new BookHandler());
        server.createContext("/api/members",      new MemberHandler());
        server.createContext("/api/transactions", new TransactionHandler());
        server.createContext("/api/dashboard",    new DashboardHandler());
        server.createContext("/api/profile",      new ProfileHandler());
        server.createContext("/api/requests",     new RequestHandler());

        // Fixed thread pool to handle concurrent requests
        server.setExecutor(Executors.newFixedThreadPool(10));
        server.start();

        System.out.println();
        System.out.println("╔══════════════════════════════════════════════╗");
        System.out.println("║   📚 Library Management System — RUNNING     ║");
        System.out.println("║                                              ║");
        System.out.println("║   API Base : http://localhost:" + PORT + "           ║");
        System.out.println("║   Endpoints:                                 ║");
        System.out.println("║     POST /api/auth/login                     ║");
        System.out.println("║     GET  /api/dashboard                      ║");
        System.out.println("║     GET  /api/books                          ║");
        System.out.println("║     GET  /api/members                        ║");
        System.out.println("║     GET  /api/transactions                   ║");
        System.out.println("║     GET  /api/profile                        ║");
        System.out.println("║     ANY  /api/requests                       ║");
        System.out.println("╚══════════════════════════════════════════════╝");
        System.out.println();
        System.out.println("Press Ctrl+C to stop the server.");
    }
}
