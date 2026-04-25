package com.library.model;

/** Represents a book in the library. */
public class Book {
    private String id;
    private String title;
    private String author;
    private String isbn;
    private String genre;
    private int    totalCopies;
    private int    available;
    private String addedAt;

    public Book() {}

    public Book(String id, String title, String author, String isbn,
                String genre, int totalCopies, int available, String addedAt) {
        this.id          = id;
        this.title       = title;
        this.author      = author;
        this.isbn        = isbn;
        this.genre       = genre;
        this.totalCopies = totalCopies;
        this.available   = available;
        this.addedAt     = addedAt;
    }

    public String getId()          { return id; }
    public void   setId(String id) { this.id = id; }

    public String getTitle()             { return title; }
    public void   setTitle(String title) { this.title = title; }

    public String getAuthor()              { return author; }
    public void   setAuthor(String author) { this.author = author; }

    public String getIsbn()            { return isbn; }
    public void   setIsbn(String isbn) { this.isbn = isbn; }

    public String getGenre()             { return genre; }
    public void   setGenre(String genre) { this.genre = genre; }

    public int  getTotalCopies()              { return totalCopies; }
    public void setTotalCopies(int totalCopies) { this.totalCopies = totalCopies; }

    public int  getAvailable()             { return available; }
    public void setAvailable(int available) { this.available = available; }

    public String getAddedAt()               { return addedAt; }
    public void   setAddedAt(String addedAt) { this.addedAt = addedAt; }
}
