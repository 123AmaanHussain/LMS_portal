package com.library.dao;

import com.library.config.DbConfig;
import com.library.model.Book;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/** Data Access Object for book CRUD operations. */
public class BookDao {

    public List<Book> getAllBooks() throws SQLException {
        List<Book> books = new ArrayList<>();
        String sql = "SELECT * FROM books ORDER BY added_at DESC";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) books.add(mapRow(rs));
        }
        return books;
    }

    public Book getBookById(String id) throws SQLException {
        String sql = "SELECT * FROM books WHERE id = ?::uuid";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    public List<Book> searchBooks(String query) throws SQLException {
        List<Book> books = new ArrayList<>();
        String sql = """
            SELECT * FROM books
            WHERE LOWER(title) LIKE ?
               OR LOWER(author) LIKE ?
               OR LOWER(COALESCE(isbn, '')) LIKE ?
               OR LOWER(COALESCE(genre, '')) LIKE ?
            ORDER BY title
            """;
        String pattern = "%" + query.toLowerCase() + "%";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, pattern);
            ps.setString(2, pattern);
            ps.setString(3, pattern);
            ps.setString(4, pattern);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) books.add(mapRow(rs));
            }
        }
        return books;
    }

    public Book addBook(Book book) throws SQLException {
        String sql = """
            INSERT INTO books (title, author, isbn, genre, total_copies, available)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING *
            """;
        int copies = book.getTotalCopies() > 0 ? book.getTotalCopies() : 1;
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, book.getTitle());
            ps.setString(2, book.getAuthor());
            ps.setString(3, book.getIsbn());
            ps.setString(4, book.getGenre());
            ps.setInt(5, copies);
            ps.setInt(6, copies);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    public Book updateBook(String id, Book book) throws SQLException {
        String sql = """
            UPDATE books
            SET title = ?, author = ?, isbn = ?, genre = ?, total_copies = ?
            WHERE id = ?::uuid
            RETURNING *
            """;
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, book.getTitle());
            ps.setString(2, book.getAuthor());
            ps.setString(3, book.getIsbn());
            ps.setString(4, book.getGenre());
            ps.setInt(5, book.getTotalCopies());
            ps.setString(6, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    public void deleteBook(String id) throws SQLException {
        String sql = "DELETE FROM books WHERE id = ?::uuid";
        try (Connection conn = DbConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.executeUpdate();
        }
    }

    private Book mapRow(ResultSet rs) throws SQLException {
        Book b = new Book();
        b.setId(rs.getString("id"));
        b.setTitle(rs.getString("title"));
        b.setAuthor(rs.getString("author"));
        b.setIsbn(rs.getString("isbn"));
        b.setGenre(rs.getString("genre"));
        b.setTotalCopies(rs.getInt("total_copies"));
        b.setAvailable(rs.getInt("available"));
        Timestamp addedAt = rs.getTimestamp("added_at");
        b.setAddedAt(addedAt != null ? addedAt.toString() : null);
        return b;
    }
}
