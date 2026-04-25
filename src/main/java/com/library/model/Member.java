package com.library.model;

/** Represents a library member. */
public class Member {
    private String  id;
    private String  name;
    private String  email;
    private String  phone;
    private String  memberId;   // e.g. "LIB-001" — the display ID
    private String  joinedAt;
    private boolean isActive;
    
    // New fields
    private String  password;       // Used only for input binding
    private Integer expiresInDays;  // Calculated field

    public Member() {}

    public Member(String id, String name, String email, String phone,
                  String memberId, String joinedAt, boolean isActive) {
        this.id       = id;
        this.name     = name;
        this.email    = email;
        this.phone    = phone;
        this.memberId = memberId;
        this.joinedAt = joinedAt;
        this.isActive = isActive;
    }

    public String getId()          { return id; }
    public void   setId(String id) { this.id = id; }

    public String getName()            { return name; }
    public void   setName(String name) { this.name = name; }

    public String getEmail()             { return email; }
    public void   setEmail(String email) { this.email = email; }

    public String getPhone()             { return phone; }
    public void   setPhone(String phone) { this.phone = phone; }

    public String getMemberId()                { return memberId; }
    public void   setMemberId(String memberId) { this.memberId = memberId; }

    public String getJoinedAt()                { return joinedAt; }
    public void   setJoinedAt(String joinedAt) { this.joinedAt = joinedAt; }

    public boolean isActive()              { return isActive; }
    public void    setActive(boolean active) { this.isActive = active; }

    public String getPassword()                { return password; }
    public void   setPassword(String password) { this.password = password; }

    public Integer getExpiresInDays()                   { return expiresInDays; }
    public void    setExpiresInDays(Integer expiresInDays) { this.expiresInDays = expiresInDays; }
}
