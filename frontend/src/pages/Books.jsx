import React, { useEffect, useState, useCallback } from 'react'
import { getBooks, addBook, updateBook, deleteBook, createRequest } from '../api/libraryApi'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { exportToCsv } from '../utils/exportCsv'
import { useAuth } from '../context/AuthContext'

const GENRES = [
  'Fiction', 'Non-Fiction', 'Science', 'Technology', 'History',
  'Biography', 'Fantasy', 'Mystery', 'Philosophy', 'Self-Help', 'Other',
]

// ─── Book Form (used in Add & Edit modals) ────────────────────────────────────
function BookForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', genre: '', totalCopies: 1,
    ...initialData,
  })

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, totalCopies: parseInt(form.totalCopies, 10) || 1 })
  }

  const labelStyle = { display: 'block', color: '#71717a', fontSize: '11px', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={labelStyle}>Book Title *</label>
        <input className="input-field" value={form.title} onChange={set('title')}
          placeholder="e.g. The Great Gatsby" required />
      </div>
      <div>
        <label style={labelStyle}>Author *</label>
        <input className="input-field" value={form.author} onChange={set('author')}
          placeholder="e.g. F. Scott Fitzgerald" required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>ISBN</label>
          <input className="input-field" value={form.isbn || ''} onChange={set('isbn')}
            placeholder="978-..." />
        </div>
        <div>
          <label style={labelStyle}>Genre</label>
          <select className="input-field" value={form.genre || ''} onChange={set('genre')}>
            <option value="">— Select —</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Number of Copies</label>
        <input className="input-field" type="number" min="1" max="999"
          value={form.totalCopies} onChange={set('totalCopies')} />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : (initialData?.id ? 'Update Book' : 'Add Book')}
        </button>
      </div>
    </form>
  )
}

// ─── Books Page ───────────────────────────────────────────────────────────────
export default function Books() {
  const toast               = useToast()
  const { isAdmin }         = useAuth()
  const [books, setBooks]   = useState([])
  const [loading, setLoading]    = useState(true)
  const [search, setSearch]      = useState('')
  const [showAdd, setShowAdd]    = useState(false)
  const [editBook, setEditBook]  = useState(null)
  const [requestBook, setRequestBook] = useState(null)
  const [requestDays, setRequestDays] = useState(14)
  const [submitting, setSubmitting] = useState(false)

  const fetchBooks = useCallback(async (q = search) => {
    setLoading(true)
    try   { setBooks(await getBooks(q)) }
    catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [search, toast])

  useEffect(() => { fetchBooks('') }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchBooks(search), 300)
    return () => clearTimeout(t)
  }, [search, fetchBooks])

  const handleAdd = async (data) => {
    setSubmitting(true)
    try   { await addBook(data); toast('Book added!'); setShowAdd(false); fetchBooks() }
    catch (e) { toast(e.message, 'error') }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (data) => {
    setSubmitting(true)
    try   { await updateBook(editBook.id, data); toast('Book updated!'); setEditBook(null); fetchBooks() }
    catch (e) { toast(e.message, 'error') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return
    try   { await deleteBook(book.id); toast('Book deleted.'); fetchBooks() }
    catch (e) { toast(e.message, 'error') }
  }

  const handleRequest = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createRequest({ bookId: requestBook.id, requestedDays: requestDays })
      toast('Request submitted! Admin will notify you.', 'success')
      setRequestBook(null)
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="reveal">
      <div className="page-header">
        <h1>Books</h1>
        <p>Explore and manage the library's vast collection.</p>
      </div>

      <div className="glass-card" style={{ padding: '32px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: '1', minWidth: '240px', maxWidth: '400px' }}>
            <svg className="icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="input-field" type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, author, genre…" />
          </div>
          
          <button className="btn-secondary" onClick={() => exportToCsv(
            'books.csv', books,
            ['title', 'author', 'isbn', 'genre', 'totalCopies', 'available'],
            ['Title', 'Author', 'ISBN', 'Genre', 'Total Copies', 'Available']
          )} disabled={books.length === 0}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Export
          </button>

          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Book
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>Finding books...</div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>
            {search ? 'No matches found for your search.' : 'The library is currently empty.'}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th><th>Author</th><th>Genre</th>
                  <th>ISBN</th><th>Available</th>{isAdmin ? <th>Actions</th> : <th>Request</th>}
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book.id}>
                    <td style={{ color: '#f8fafc', fontWeight: 800, maxWidth: '280px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {book.title}
                      </div>
                    </td>
                    <td style={{ color: '#d4d4d8' }}>{book.author}</td>
                    <td>
                      {book.genre && (
                        <span style={{
                          background: 'rgba(245, 158, 11, 0.08)', color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
                          textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>{book.genre}</span>
                      )}
                    </td>
                    <td style={{ color: '#71717a', fontFamily: 'monospace', fontSize: '13px', fontWeight: 600 }}>
                      {book.isbn || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', width: '60px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${(book.available / book.totalCopies) * 100}%`,
                            background: book.available > 0 ? '#f59e0b' : '#ef4444',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{
                          fontWeight: 800, fontSize: '14px',
                          color: book.available > 0 ? '#fbbf24' : '#ef4444',
                        }}>
                          {book.available}/{book.totalCopies}
                        </span>
                      </div>
                    </td>
                    {isAdmin ? (
                      <td>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setEditBook(book)}>Edit</button>
                          <button className="btn-danger" style={{ padding: '8px 16px' }} onClick={() => handleDelete(book)}>Delete</button>
                        </div>
                      </td>
                    ) : (
                      <td>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '8px 16px', fontSize: '12px' }} 
                          disabled={book.available === 0}
                          onClick={() => setRequestBook(book)}
                        >
                          Request
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '24px', color: '#52525b', fontSize: '14px', fontWeight: 600 }}>
          {books.length} book{books.length !== 1 ? 's' : ''} in view
        </div>
      </div>

      {showAdd && (
        <Modal title="Catalog New Book" onClose={() => setShowAdd(false)}>
          <BookForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} loading={submitting} />
        </Modal>
      )}
      {editBook && (
        <Modal title="Update Book Details" onClose={() => setEditBook(null)}>
          <BookForm initialData={editBook} onSubmit={handleEdit} onCancel={() => setEditBook(null)} loading={submitting} />
        </Modal>
      )}
      {requestBook && (
        <Modal title="Request Book" onClose={() => setRequestBook(null)}>
          <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ color: '#d4d4d8', fontSize: '14px' }}>
              Requesting to borrow <strong>{requestBook.title}</strong>
            </p>
            <div>
              <label style={{ display: 'block', color: '#71717a', fontSize: '11px', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase' }}>
                Loan Duration (Days)
              </label>
              <input 
                className="input-field" 
                type="number" 
                min="1" max="30" 
                value={requestDays} 
                onChange={e => setRequestDays(e.target.value)} 
                required 
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setRequestBook(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
