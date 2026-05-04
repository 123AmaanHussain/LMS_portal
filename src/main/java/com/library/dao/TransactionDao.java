package com.library.dao;

import com.library.config.DbConfig;
import com.library.model.DashboardStats;
import com.library.model.Transaction;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for book issue/return transactions.
 *
 * Business rules:
 *  - Loan period  : 14 days
 *  - Fine rate    : ₹5 per overdue day
 *  - Issue guard  : book.available must be > 0
 *  - Return only  : transactions whose status = 'ISSUED'
 */
public class TransactionDao {

    private static final double FINE_PER_DAY    = 5.0;
    private static final int    LOAN_DAYS       = 14;
    private static final int    MAX_ACTIVE_ISSUES = 5;  // max books a member can borrow at once

    // ─── Query helpers ────────────────────────────────────────────────────────

    /** SQL select that joins books + members for rich transaction data. */
    private static final String SELECT_TX = """
        SELECT t.*,
               b.title     AS book_title,
               m.name      AS member_name,
               m.member_id AS member_code
        FROM   transactions t
        JOIN   books   b ON t.book_id   = b.id
        JOIN   members m ON t.member_id = m.id
        """;

    // ─── Read operations ──────────────────────────────────────────────────────

    public List<Transaction> getAllTransactions() throws SQLException {
        String sql = SELECT_TX + " ORDER BY t.issued_at DESC LIMIT 200";
        return queryList(sql);
    }

    public List<Transaction> getActiveTransactions() throws SQLException {
        String sql = SELECT_TX + " WHERE t.status = 'ISSUED' ORDER BY t.due_date ASC";
        return queryList(sql);
    }

    public List<Transaction> getOverdueTransactions() throws SQLException {
        String sql = SELECT_TX
            + " WHERE t.status = 'ISSUED' AND t.due_date < NOW() ORDER BY t.due_date ASC";
        return queryList(sql);
    }

    public Transaction getTransactionById(String id) throws SQLException {
        String sql = SELECT_TX + " WHERE t.id = ?::uuid";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    // ─── Issue a book ─────────────────────────────────────────────────────────

    public Transaction issueBook(String bookId, String memberId) throws SQLException {
        return issueBook(bookId, memberId, LOAN_DAYS);
    }

    public Transaction issueBook(String bookId, String memberId, int loanDays) throws SQLException {
        List<Transaction> result = issueBooks(java.util.Collections.singletonList(bookId), memberId, loanDays);
        return result.isEmpty() ? null : result.get(0);
    }

    public List<Transaction> issueBooks(List<String> bookIds, String memberId) throws SQLException {
        return issueBooks(bookIds, memberId, LOAN_DAYS);
    }

    public List<Transaction> issueBooks(List<String> bookIds, String memberId, int loanDays) throws SQLException {
        if (bookIds == null || bookIds.isEmpty()) throw new SQLException("No books selected for issue.");
        
        List<String> txIds = new java.util.ArrayList<>();

        try (Connection conn = DbConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Verify member is active
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT is_active FROM members WHERE id = ?::uuid")) {
                    ps.setString(1, memberId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) throw new SQLException("Member not found.");
                        if (!rs.getBoolean("is_active"))
                            throw new SQLException("Member account is inactive.");
                    }
                }

                // 2. Enforce borrowing limit (total count after this issue)
                int currentIssues;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT COUNT(*) FROM transactions WHERE member_id = ?::uuid AND status = 'ISSUED'")) {
                    ps.setString(1, memberId);
                    try (ResultSet rs = ps.executeQuery()) {
                        currentIssues = rs.next() ? rs.getInt(1) : 0;
                    }
                }

                if (currentIssues + bookIds.size() > MAX_ACTIVE_ISSUES) {
                    throw new SQLException(String.format(
                        "Borrowing limit reached. Member currently has %d active loans. Issuing %d more would exceed the limit of %d.",
                        currentIssues, bookIds.size(), MAX_ACTIVE_ISSUES));
                }

                for (String bookId : bookIds) {
                    // 3. Lock the book row and check availability
                    int available;
                    try (PreparedStatement ps = conn.prepareStatement(
                            "SELECT available FROM books WHERE id = ?::uuid FOR UPDATE")) {
                        ps.setString(1, bookId);
                        try (ResultSet rs = ps.executeQuery()) {
                            if (!rs.next()) throw new SQLException("Book not found ID: " + bookId);
                            available = rs.getInt("available");
                        }
                    }
                    if (available <= 0) throw new SQLException("No copies available for book ID: " + bookId);

                    // 4. Insert transaction
                    String sql = "INSERT INTO transactions (book_id, member_id, due_date) VALUES (?::uuid, ?::uuid, NOW() + INTERVAL '" + loanDays + " days') RETURNING id";
                    try (PreparedStatement ps = conn.prepareStatement(sql)) {
                        ps.setString(1, bookId);
                        ps.setString(2, memberId);
                        try (ResultSet rs = ps.executeQuery()) {
                            if (rs.next()) txIds.add(rs.getString("id"));
                        }
                    }

                    // 5. Decrement available count
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE books SET available = available - 1 WHERE id = ?::uuid")) {
                        ps.setString(1, bookId);
                        ps.executeUpdate();
                    }
                }

                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }

        // Fetch full details for all created transactions
        List<Transaction> results = new java.util.ArrayList<>();
        for (String tid : txIds) {
            results.add(getTransactionById(tid));
        }
        return results;
    }

    // ─── Return a book ────────────────────────────────────────────────────────

    public Transaction returnBook(String transactionId) throws SQLException {
        String bookId = null;

        try (Connection conn = DbConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Lock and verify the transaction
                Timestamp dueDate;
                try (PreparedStatement ps = conn.prepareStatement("""
                        SELECT book_id, due_date FROM transactions
                        WHERE id = ?::uuid AND status = 'ISSUED'
                        FOR UPDATE
                        """)) {
                    ps.setString(1, transactionId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next())
                            throw new SQLException("No active issue found for this transaction ID. It may have already been returned.");
                        bookId  = rs.getString("book_id");
                        dueDate = rs.getTimestamp("due_date");
                    }
                }

                // 2. Calculate fine (₹5 per day overdue)
                double fine = 0.0;
                if (dueDate != null) {
                    LocalDateTime due = dueDate.toLocalDateTime();
                    LocalDateTime now = LocalDateTime.now();
                    if (now.isAfter(due)) {
                        long daysOverdue = ChronoUnit.DAYS.between(due, now);
                        fine = daysOverdue * FINE_PER_DAY;
                    }
                }

                // 3. Mark transaction as returned
                try (PreparedStatement ps = conn.prepareStatement("""
                        UPDATE transactions
                        SET returned_at = NOW(), fine_amount = ?, status = 'RETURNED'
                        WHERE id = ?::uuid
                        """)) {
                    ps.setDouble(1, fine);
                    ps.setString(2, transactionId);
                    ps.executeUpdate();
                }

                // 4. Restore book availability
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE books SET available = available + 1 WHERE id = ?::uuid")) {
                    ps.setString(1, bookId);
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

        // Fetch full details using a fresh connection after commit
        return getTransactionById(transactionId);
    }

    // ─── Dashboard stats ──────────────────────────────────────────────────────

    public DashboardStats getDashboardStats() throws SQLException {
        DashboardStats stats = new DashboardStats();

        try (Connection conn = DbConfig.getConnection()) {
            stats.setTotalBooks(scalarLong(conn, "SELECT COUNT(*) FROM books"));
            stats.setTotalMembers(scalarLong(conn, "SELECT COUNT(*) FROM members WHERE is_active = true"));
            stats.setActiveIssues(scalarLong(conn, "SELECT COUNT(*) FROM transactions WHERE status = 'ISSUED'"));
            stats.setOverdueCount(scalarLong(conn,
                "SELECT COUNT(*) FROM transactions WHERE status = 'ISSUED' AND due_date < NOW()"));
            stats.setReturnedToday(scalarLong(conn,
                "SELECT COUNT(*) FROM transactions WHERE status = 'RETURNED' AND DATE(returned_at) = CURRENT_DATE"));

            // Total fines collected from all returned transactions
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COALESCE(SUM(fine_amount), 0) FROM transactions WHERE status = 'RETURNED'");
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) stats.setTotalFineCollected(rs.getDouble(1));
            }
        }

        stats.setRecentTransactions(getRecentTransactions());
        return stats;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private List<Transaction> getRecentTransactions() throws SQLException {
        String sql = SELECT_TX + " ORDER BY t.issued_at DESC LIMIT 10";
        return queryList(sql);
    }

    private List<Transaction> queryList(String sql) throws SQLException {
        List<Transaction> list = new ArrayList<>();
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        }
        return list;
    }

    private long scalarLong(Connection conn, String sql) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            return rs.next() ? rs.getLong(1) : 0L;
        }
    }

    private Transaction mapRow(ResultSet rs) throws SQLException {
        Transaction t = new Transaction();
        t.setId(rs.getString("id"));
        t.setBookId(rs.getString("book_id"));
        t.setMemberId(rs.getString("member_id"));
        t.setBookTitle(rs.getString("book_title"));
        t.setMemberName(rs.getString("member_name"));
        t.setMemberCode(rs.getString("member_code"));
        t.setFineAmount(rs.getDouble("fine_amount"));
        t.setStatus(rs.getString("status"));

        Timestamp issuedAt   = rs.getTimestamp("issued_at");
        Timestamp dueDate    = rs.getTimestamp("due_date");
        Timestamp returnedAt = rs.getTimestamp("returned_at");
        t.setIssuedAt(issuedAt   != null ? issuedAt.toString()   : null);
        t.setDueDate(dueDate     != null ? dueDate.toString()    : null);
        t.setReturnedAt(returnedAt != null ? returnedAt.toString() : null);
        return t;
    }
}
