package com.library.dao;

import com.library.config.DbConfig;
import java.sql.*;
import java.util.HashMap;
import java.util.Map;

/**
 * Data Access Object for authentication queries.
 * Handles admin login (users table) and member login (members table).
 */
public class AuthDao {

    /**
     * Authenticates an admin user.
     * @return Map with user details if valid, null otherwise.
     */
    public Map<String, String> authenticateAdmin(String username, String password) throws SQLException {
        String sql = "SELECT id, username, role FROM users WHERE username = ? AND password = ?";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.setString(2, password);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Map<String, String> user = new HashMap<>();
                    user.put("id",       rs.getString("id"));
                    user.put("username", rs.getString("username"));
                    user.put("role",     rs.getString("role"));
                    return user;
                }
            }
        }
        return null;
    }

    /**
     * Authenticates a library member using their member_id (e.g. LIB-001) and password.
     * @return Map with member details if valid, null otherwise.
     */
    public Map<String, String> authenticateMember(String memberId, String password) throws SQLException {
        String sql = """
            SELECT id, name, email, phone, member_id, is_active
            FROM members
            WHERE member_id = ? AND password = ?
            """;
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, memberId.toUpperCase().trim());
            ps.setString(2, password);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    if (!rs.getBoolean("is_active")) {
                        throw new RuntimeException("ACCOUNT_SUSPENDED");
                    }
                    Map<String, String> member = new HashMap<>();
                    member.put("id",       rs.getString("id"));
                    member.put("name",     rs.getString("name"));
                    member.put("email",    rs.getString("email"));
                    member.put("phone",    rs.getString("phone"));
                    member.put("memberId", rs.getString("member_id"));
                    return member;
                }
            }
        }
        return null;
    }
}
