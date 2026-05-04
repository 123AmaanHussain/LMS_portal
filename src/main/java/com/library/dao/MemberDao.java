package com.library.dao;

import com.library.config.DbConfig;
import com.library.model.Member;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/** Data Access Object for member CRUD operations. */
public class MemberDao {

    public List<Member> getAllMembers() throws SQLException {
        List<Member> members = new ArrayList<>();
        String sql = "SELECT * FROM members ORDER BY joined_at DESC";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) members.add(mapRow(rs));
        }
        return members;
    }

    public Member getMemberById(String id) throws SQLException {
        String sql = "SELECT * FROM members WHERE id = ?::uuid";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    public List<Member> searchMembers(String query) throws SQLException {
        List<Member> members = new ArrayList<>();
        String sql = """
            SELECT * FROM members
            WHERE LOWER(name)  LIKE ?
               OR LOWER(email) LIKE ?
               OR UPPER(member_id) LIKE ?
            ORDER BY name
            """;
        String pattern = "%" + query.toLowerCase() + "%";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, pattern);
            ps.setString(2, pattern);
            ps.setString(3, pattern.toUpperCase());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) members.add(mapRow(rs));
            }
        }
        return members;
    }

    public Member addMember(Member member) throws SQLException {
        String memberId = generateNextMemberId();
        String sql = """
            INSERT INTO members (name, email, phone, member_id, password)
            VALUES (?, ?, ?, ?, ?)
            RETURNING *
            """;
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, member.getName());
            ps.setString(2, member.getEmail());
            ps.setString(3, member.getPhone());
            ps.setString(4, memberId);
            
            String pass = member.getPassword();
            if (pass == null || pass.isBlank()) pass = "library123";
            ps.setString(5, pass);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    public Member updateMember(String id, Member member) throws SQLException {
        String sql = """
            UPDATE members
            SET name = ?, email = ?, phone = ?, is_active = ?
            WHERE id = ?::uuid
            RETURNING *
            """;
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, member.getName());
            ps.setString(2, member.getEmail());
            ps.setString(3, member.getPhone());
            ps.setBoolean(4, member.isActive());
            ps.setString(5, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    public void deleteMember(String id) throws SQLException {
        try (Connection conn = DbConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Restore availability for books currently issued to this member
                String updateBooksSql = """
                    UPDATE books SET available = available + 1
                    WHERE id IN (
                        SELECT book_id FROM transactions
                        WHERE member_id = ?::uuid AND status = 'ISSUED'
                    )
                    """;
                try (PreparedStatement ps = conn.prepareStatement(updateBooksSql)) {
                    ps.setString(1, id);
                    ps.executeUpdate();
                }

                // 2. Delete all transactions for this member (to satisfy foreign key)
                String deleteTxSql = "DELETE FROM transactions WHERE member_id = ?::uuid";
                try (PreparedStatement ps = conn.prepareStatement(deleteTxSql)) {
                    ps.setString(1, id);
                    ps.executeUpdate();
                }

                // 3. Delete the member record
                String deleteMemberSql = "DELETE FROM members WHERE id = ?::uuid";
                try (PreparedStatement ps = conn.prepareStatement(deleteMemberSql)) {
                    ps.setString(1, id);
                    ps.executeUpdate();
                }

                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    /** Generates the next sequential member ID like LIB-001, LIB-002, etc. */
    private String generateNextMemberId() throws SQLException {
        String sql = "SELECT COUNT(*) FROM members";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                long count = rs.getLong(1);
                return String.format("LIB-%03d", count + 1);
            }
        }
        return "LIB-001";
    }

    private Member mapRow(ResultSet rs) throws SQLException {
        Member m = new Member();
        m.setId(rs.getString("id"));
        m.setName(rs.getString("name"));
        m.setEmail(rs.getString("email"));
        m.setPhone(rs.getString("phone"));
        m.setMemberId(rs.getString("member_id"));
        m.setActive(rs.getBoolean("is_active"));
        Timestamp joinedAt = rs.getTimestamp("joined_at");
        m.setJoinedAt(joinedAt != null ? joinedAt.toString() : null);
        
        if (joinedAt != null) {
            long diffMillis = (joinedAt.getTime() + 365L * 24 * 60 * 60 * 1000) - System.currentTimeMillis();
            int days = (int) (diffMillis / (1000 * 60 * 60 * 24));
            m.setExpiresInDays(days < 0 ? 0 : days);
        }
        return m;
    }
}
