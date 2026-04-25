package com.library.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Manages JDBC connections to Supabase PostgreSQL.
 * Uses Supabase's Transaction Pooler (port 6543) for best compatibility.
 *
 * Each call to getConnection() returns a fresh connection.
 * Supabase's Pgbouncer handles the actual connection pool on their end.
 * Always close connections in a finally block or try-with-resources.
 */
public class DbConfig {

    private static final String URL      = EnvLoader.get("DB_URL");
    private static final String USER     = EnvLoader.get("DB_USER");
    private static final String PASSWORD = EnvLoader.get("DB_PASSWORD");

    static {
        if (URL.isBlank()) {
            System.err.println("""
                ╔══════════════════════════════════════════════════╗
                ║  [DbConfig] ✗ DATABASE NOT CONFIGURED!           ║
                ║  Create a .env file in the project root with:   ║
                ║  DB_URL=jdbc:postgresql://<pooler-host>:6543/... ║
                ║  DB_USER=postgres.<project-ref>                  ║
                ║  DB_PASSWORD=<your-password>                     ║
                ║  See .env.example for details.                   ║
                ╚══════════════════════════════════════════════════╝
                """);
        } else {
            System.out.println("[DbConfig] ✓ Database configured: "
                + URL.substring(0, Math.min(50, URL.length())) + "...");
        }
    }

    /**
     * Returns a fresh JDBC connection to the Supabase database.
     * Caller is responsible for closing the connection.
     */
    public static Connection getConnection() throws SQLException {
        if (URL.isBlank()) {
            throw new SQLException(
                "Database not configured. Create a .env file. See .env.example for reference.");
        }
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}
