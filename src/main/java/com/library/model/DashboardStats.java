package com.library.model;

import java.util.List;

/** Aggregated dashboard statistics returned by GET /api/dashboard. */
public class DashboardStats {
    private long              totalBooks;
    private long              totalMembers;
    private long              activeIssues;
    private long              overdueCount;
    private long              returnedToday;
    private double            totalFineCollected;
    private List<Transaction> recentTransactions;

    public long getTotalBooks()                    { return totalBooks; }
    public void setTotalBooks(long totalBooks)     { this.totalBooks = totalBooks; }

    public long getTotalMembers()                      { return totalMembers; }
    public void setTotalMembers(long totalMembers)     { this.totalMembers = totalMembers; }

    public long getActiveIssues()                      { return activeIssues; }
    public void setActiveIssues(long activeIssues)     { this.activeIssues = activeIssues; }

    public long getOverdueCount()                      { return overdueCount; }
    public void setOverdueCount(long overdueCount)     { this.overdueCount = overdueCount; }

    public long getReturnedToday()                     { return returnedToday; }
    public void setReturnedToday(long returnedToday)   { this.returnedToday = returnedToday; }

    public double getTotalFineCollected()                          { return totalFineCollected; }
    public void   setTotalFineCollected(double totalFineCollected) { this.totalFineCollected = totalFineCollected; }

    public List<Transaction> getRecentTransactions()                               { return recentTransactions; }
    public void              setRecentTransactions(List<Transaction> transactions) { this.recentTransactions = transactions; }
}
