package com.library.model;

/**
 * Represents a book issue/return transaction.
 * Status: ISSUED | RETURNED
 * Fine: ₹5 per day overdue, computed on return.
 */
public class Transaction {
    private String id;
    private String bookId;
    private String memberId;      // UUID of the member
    private String bookTitle;     // Joined from books table
    private String memberName;    // Joined from members table
    private String memberCode;    // The readable ID e.g. "LIB-001"
    private String issuedAt;
    private String dueDate;
    private String returnedAt;    // null if not yet returned
    private double fineAmount;
    private String status;        // "ISSUED" or "RETURNED"

    public Transaction() {}

    public String getId()          { return id; }
    public void   setId(String id) { this.id = id; }

    public String getBookId()              { return bookId; }
    public void   setBookId(String bookId) { this.bookId = bookId; }

    public String getMemberId()                { return memberId; }
    public void   setMemberId(String memberId) { this.memberId = memberId; }

    public String getBookTitle()               { return bookTitle; }
    public void   setBookTitle(String t)       { this.bookTitle = t; }

    public String getMemberName()              { return memberName; }
    public void   setMemberName(String n)      { this.memberName = n; }

    public String getMemberCode()              { return memberCode; }
    public void   setMemberCode(String c)      { this.memberCode = c; }

    public String getIssuedAt()                { return issuedAt; }
    public void   setIssuedAt(String issuedAt) { this.issuedAt = issuedAt; }

    public String getDueDate()               { return dueDate; }
    public void   setDueDate(String dueDate) { this.dueDate = dueDate; }

    public String getReturnedAt()                  { return returnedAt; }
    public void   setReturnedAt(String returnedAt) { this.returnedAt = returnedAt; }

    public double getFineAmount()               { return fineAmount; }
    public void   setFineAmount(double fine)    { this.fineAmount = fine; }

    public String getStatus()              { return status; }
    public void   setStatus(String status) { this.status = status; }
}
