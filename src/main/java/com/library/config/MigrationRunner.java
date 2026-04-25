package com.library.config;

import java.sql.Connection;
import java.sql.Statement;

public class MigrationRunner {
    public static void run() {
        String sql = """
            CREATE TABLE IF NOT EXISTS book_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
                member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                requested_days INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
            """;
        
        try (Connection conn = DbConfig.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
            System.out.println("[MigrationRunner] ✓ book_requests table checked/created.");
        } catch (Exception e) {
            System.err.println("[MigrationRunner] ✗ Failed to run migration: " + e.getMessage());
        }
    }
}
