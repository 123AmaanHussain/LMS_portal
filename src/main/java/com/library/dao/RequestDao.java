package com.library.dao;

import com.library.config.DbConfig;
import com.library.model.BookRequest;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class RequestDao {

    public void createRequest(BookRequest request) throws SQLException {
        String sql = "INSERT INTO book_requests (book_id, member_id, requested_days) VALUES (?::uuid, ?::uuid, ?)";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, request.getBookId());
            ps.setString(2, request.getMemberId());
            ps.setInt(3, request.getRequestedDays());
            ps.executeUpdate();
        }
    }

    public List<BookRequest> getPendingRequests() throws SQLException {
        String sql = """
            SELECT r.*, b.title as book_title, m.name as member_name, m.member_id as member_code
            FROM book_requests r
            JOIN books b ON r.book_id = b.id
            JOIN members m ON r.member_id = m.id
            WHERE r.status = 'PENDING'
            ORDER BY r.created_at DESC
            """;
        return fetchRequests(sql);
    }

    public List<BookRequest> getRequestsByMember(String memberId) throws SQLException {
        String sql = """
            SELECT r.*, b.title as book_title, m.name as member_name, m.member_id as member_code
            FROM book_requests r
            JOIN books b ON r.book_id = b.id
            JOIN members m ON r.member_id = m.id
            WHERE r.member_id = ?::uuid
            ORDER BY r.created_at DESC
            """;
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, memberId);
            try (ResultSet rs = ps.executeQuery()) {
                return mapList(rs);
            }
        }
    }

    public BookRequest getRequestById(String id) throws SQLException {
        String sql = "SELECT * FROM book_requests WHERE id = ?::uuid";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    BookRequest r = new BookRequest();
                    r.setId(rs.getString("id"));
                    r.setBookId(rs.getString("book_id"));
                    r.setMemberId(rs.getString("member_id"));
                    r.setRequestedDays(rs.getInt("requested_days"));
                    r.setStatus(rs.getString("status"));
                    return r;
                }
            }
        }
        return null;
    }

    public void updateStatus(String id, String status) throws SQLException {
        String sql = "UPDATE book_requests SET status = ? WHERE id = ?::uuid";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, id);
            ps.executeUpdate();
        }
    }

    private List<BookRequest> fetchRequests(String sql) throws SQLException {
        try (Connection conn = DbConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            return mapList(rs);
        }
    }

    private List<BookRequest> mapList(ResultSet rs) throws SQLException {
        List<BookRequest> list = new ArrayList<>();
        while (rs.next()) {
            BookRequest r = new BookRequest();
            r.setId(rs.getString("id"));
            r.setBookId(rs.getString("book_id"));
            r.setMemberId(rs.getString("member_id"));
            r.setRequestedDays(rs.getInt("requested_days"));
            r.setStatus(rs.getString("status"));
            r.setCreatedAt(rs.getTimestamp("created_at").toString());
            r.setBookTitle(rs.getString("book_title"));
            r.setMemberName(rs.getString("member_name"));
            r.setMemberCode(rs.getString("member_code"));
            list.add(r);
        }
        return list;
    }
}
