-- ============================================================
-- Library Management System — Supabase Database Schema
-- Run this SQL in your Supabase project's SQL Editor
-- ============================================================

-- ─── Members Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    phone       TEXT,
    member_id   TEXT UNIQUE NOT NULL,   -- e.g. LIB-001
    password    TEXT NOT NULL DEFAULT 'library123',
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active   BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);

-- ─── Users Table (Admin accounts) ────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'MEMBER')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default admin user
INSERT INTO users (username, password, role) VALUES
    ('admin', 'admin', 'ADMIN')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ─── Books Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL,
    author        TEXT NOT NULL,
    isbn          TEXT UNIQUE,
    genre         TEXT,
    total_copies  INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 1),
    available     INTEGER NOT NULL DEFAULT 1 CHECK (available >= 0),
    added_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_title ON books(LOWER(title));
CREATE INDEX IF NOT EXISTS idx_books_author ON books(LOWER(author));

-- ─── Transactions Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id       UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    member_id     UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    issued_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date      TIMESTAMPTZ NOT NULL,
    returned_at   TIMESTAMPTZ,                        -- NULL = not yet returned
    fine_amount   NUMERIC(8, 2) NOT NULL DEFAULT 0,   -- ₹5 per overdue day
    status        TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'RETURNED'))
);

CREATE INDEX IF NOT EXISTS idx_tx_book_id ON transactions(book_id);
CREATE INDEX IF NOT EXISTS idx_tx_member_id ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_tx_due_date ON transactions(due_date);

-- ─── Enable Row Level Security ────────────────────────────
-- Enable RLS on all tables (required for Supabase security)
ALTER TABLE members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE books      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;

-- Allow all operations (since our Java backend uses service_role / DB password directly)
-- Adjust these policies based on your authentication requirements
CREATE POLICY "Allow all for service role" ON members    FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON books      FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON users      FOR ALL USING (true);

-- ─── Sample Data (Optional) ───────────────────────────────
INSERT INTO members (name, email, phone, member_id, is_active) VALUES
    ('Amaan Hussain',  'amaan@library.in',  '+91 98765 43210', 'LIB-001', true),
    ('Priya Sharma',   'priya@library.in',  '+91 87654 32109', 'LIB-002', true),
    ('Rahul Verma',    'rahul@library.in',  '+91 76543 21098', 'LIB-003', true)
ON CONFLICT DO NOTHING;

INSERT INTO books (title, author, isbn, genre, total_copies, available) VALUES
    ('The Great Gatsby',          'F. Scott Fitzgerald',  '978-0743273565', 'Fiction',     3, 3),
    ('Clean Code',                 'Robert C. Martin',     '978-0132350884', 'Technology',  2, 2),
    ('Atomic Habits',              'James Clear',          '978-0735211292', 'Self-Help',   4, 4),
    ('Introduction to Algorithms', 'Cormen et al.',        '978-0262033848', 'Technology',  2, 2),
    ('1984',                       'George Orwell',        '978-0451524935', 'Fiction',     3, 3)
ON CONFLICT DO NOTHING;
