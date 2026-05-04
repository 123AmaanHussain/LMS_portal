import React, { useEffect, useState, useCallback } from 'react'
import {
  getTransactions, getActiveTransactions,
  getBooks, getMembers,
  issueBook, returnBook,
  getRequests, approveRequest, rejectRequest,
} from '../api/libraryApi'
import { useToast } from '../components/Toast'
import { exportToCsv } from '../utils/exportCsv'

const fmtDate = (str) =>
  str ? new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date()

const daysOverdue = (dueDate) =>
  Math.max(0, Math.floor((new Date() - new Date(dueDate)) / 86_400_000))

const getStatusBadge = (status, dueDate) => {
  if (status === 'RETURNED') return { cls: 'badge badge-returned', label: 'Returned' }
  if (isOverdue(dueDate))    return { cls: 'badge badge-overdue',  label: 'Overdue'  }
  return { cls: 'badge badge-issued', label: 'Issued' }
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '12px 28px', borderRadius: '12px',
      cursor: 'pointer', fontSize: '14px', fontWeight: active ? 800 : 500,
      background: active
        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
        : 'rgba(255, 255, 255, 0.03)',
      color: active ? '#fff' : '#71717a',
      border: active ? 'none' : '1px solid rgba(255,255,255,0.05)',
      boxShadow: active ? '0 8px 24px rgba(245, 158, 11, 0.25)' : 'none',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      fontFamily: 'Outfit, sans-serif',
    }}>
      {children}
    </button>
  )
}

// ─── Transactions Page ────────────────────────────────────────────────────────
export default function Transactions() {
  const toast = useToast()

  const [tab, setTab]                       = useState('all')
  const [transactions, setTransactions]     = useState([])
  const [activeList, setActiveList]         = useState([])
  const [books, setBooks]                   = useState([])
  const [members, setMembers]               = useState([])
  const [requests, setRequests]             = useState([])
  const [loading, setLoading]               = useState(false)
  const [submitting, setSubmitting]         = useState(false)
  const [issueMode, setIssueMode]           = useState('single') // 'single' or 'multiple'
  const [issueForm, setIssueForm]           = useState({ bookId: '', bookIds: [], memberId: '' })

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [txs, active, bks, mems, reqs] = await Promise.all([
        getTransactions(), getActiveTransactions(), getBooks(), getMembers(), getRequests(),
      ])
      setTransactions(txs)
      setActiveList(active)
      setBooks(bks)
      setMembers(mems)
      setRequests(reqs)
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadAll() }, [loadAll])

  // ─── Issue Book ─────────────────────────────────────────────────────────────
  const handleIssue = async (e) => {
    e.preventDefault()
    if (!issueForm.memberId) { toast('Please select a member.', 'warning'); return }
    
    let payload = { memberId: issueForm.memberId }
    if (issueMode === 'single') {
      if (!issueForm.bookId) { toast('Please select a book.', 'warning'); return }
      payload.bookId = issueForm.bookId
    } else {
      if (issueForm.bookIds.length === 0) { toast('Please select at least one book.', 'warning'); return }
      payload.bookIds = issueForm.bookIds
    }

    setSubmitting(true)
    try {
      const res = await issueBook(payload)
      const count = Array.isArray(res) ? res.length : 1
      toast(`✓ ${count} book(s) issued!`)
      setIssueForm({ bookId: '', bookIds: [], memberId: '' })
      loadAll()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleBookSelection = (id) => {
    setIssueForm(p => {
      const exists = p.bookIds.includes(id)
      return {
        ...p,
        bookIds: exists ? p.bookIds.filter(x => x !== id) : [...p.bookIds, id]
      }
    })
  }

  // ─── Return Book ────────────────────────────────────────────────────────────
  const handleReturn = async (transactionId, bookTitle, fine) => {
    setSubmitting(true)
    try {
      const res = await returnBook(transactionId)
      const fineMsg = fine > 0 ? ` Fine collected: ₹${fine}` : ''
      toast(`"${bookTitle}" returned successfully!${fineMsg}`, 'success')
      
      // Handle PDF Receipt download
      if (res.receiptPdf) {
        const link = document.createElement('a')
        link.href = `data:application/pdf;base64,${res.receiptPdf}`
        link.download = `receipt_${transactionId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast('Receipt downloaded!', 'info')
      }
      
      loadAll()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }


  const handleApprove = async (id) => {
    setSubmitting(true)
    try {
      await approveRequest(id)
      toast('Request approved! Book issued.', 'success')
      loadAll()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (id) => {
    setSubmitting(true)
    try {
      await rejectRequest(id)
      toast('Request rejected.', 'success')
      loadAll()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const availableBooks  = books.filter(b => b.available > 0)
  const activeMembers   = members.filter(m => m.isActive)

  const labelStyle = {
    display: 'block', color: '#71717a', fontSize: '11px', fontWeight: 800,
    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em',
  }

  return (
    <div className="reveal">
      <div className="page-header">
        <h1>Issue & Return</h1>
        <p>Orchestrate book loans and streamline return processes.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'all'}    onClick={() => setTab('all')}>📋 History</TabBtn>
        <TabBtn active={tab === 'issue'}  onClick={() => setTab('issue')}>📤 Issue Book</TabBtn>
        <TabBtn active={tab === 'return'} onClick={() => setTab('return')}>📥 Return Book</TabBtn>
        <TabBtn active={tab === 'requests'} onClick={() => setTab('requests')}>
          🔔 Requests {requests.length > 0 && <span style={{ marginLeft: '8px', background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>{requests.length}</span>}
        </TabBtn>
      </div>

      {/* ── All Transactions Tab ─────────────────────────────────────────────── */}
      {tab === 'all' && (
        <div className="glass-card fade-up" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>Transaction History</h2>
            <button className="btn-secondary" onClick={() => exportToCsv(
              'transactions.csv',
              transactions.map(tx => ({ ...tx, issuedAt: tx.issuedAt ? new Date(tx.issuedAt).toLocaleDateString() : '', dueDate: tx.dueDate ? new Date(tx.dueDate).toLocaleDateString() : '', returnedAt: tx.returnedAt ? new Date(tx.returnedAt).toLocaleDateString() : '' })),
              ['bookTitle', 'memberName', 'memberCode', 'issuedAt', 'dueDate', 'returnedAt', 'status', 'fineAmount'],
              ['Book', 'Member', 'Member ID', 'Issued', 'Due Date', 'Returned', 'Status', 'Fine (₹)']
            )} disabled={transactions.length === 0}>⬇ Export CSV</button>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>Retrieving archive...</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>
              No transactions recorded in the system.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Book</th><th>Member</th><th>ID</th>
                    <th>Issued</th><th>Due Date</th><th>Returned</th>
                    <th>Status</th><th>Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => {
                    const badge = getStatusBadge(tx.status, tx.dueDate)
                    return (
                      <tr key={tx.id}>
                        <td style={{ color: '#f8fafc', fontWeight: 700 }}>{tx.bookTitle}</td>
                        <td style={{ color: '#d4d4d8' }}>{tx.memberName}</td>
                        <td>
                          <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>
                            {tx.memberCode}
                          </span>
                        </td>
                        <td style={{ color: '#a1a1aa', fontSize: '14px' }}>{fmtDate(tx.issuedAt)}</td>
                        <td style={{
                          fontSize: '14px',
                          color: isOverdue(tx.dueDate) && tx.status === 'ISSUED' ? '#ef4444' : '#a1a1aa',
                          fontWeight: isOverdue(tx.dueDate) && tx.status === 'ISSUED' ? 800 : 400,
                        }}>{fmtDate(tx.dueDate)}</td>
                        <td style={{ color: '#a1a1aa', fontSize: '14px' }}>{fmtDate(tx.returnedAt)}</td>
                        <td><span className={badge.cls}>{badge.label}</span></td>
                        <td style={{ color: tx.fineAmount > 0 ? '#ef4444' : '#71717a', fontWeight: 800 }}>
                          {tx.fineAmount > 0 ? `₹${tx.fineAmount}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Issue Book Tab ────────────────────────────────────────────────────── */}
      {tab === 'issue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Issue Form */}
          <div className="glass-card fade-up" style={{ padding: '40px' }}>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '8px' }}>Create Issue</h2>
            <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '32px' }}>
              Select a member and book(s) to record a new loan.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                onClick={() => setIssueMode('single')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', border: 'none',
                  background: issueMode === 'single' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  color: issueMode === 'single' ? '#fbbf24' : '#71717a',
                  fontWeight: 800, fontSize: '12px', transition: 'all 0.2s'
                }}
              >Single Book</button>
              <button 
                onClick={() => setIssueMode('multiple')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', border: 'none',
                  background: issueMode === 'multiple' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  color: issueMode === 'multiple' ? '#fbbf24' : '#71717a',
                  fontWeight: 800, fontSize: '12px', transition: 'all 0.2s'
                }}
              >Multiple Books</button>
            </div>

            <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={labelStyle}>👤 Target Member *</label>
                <select className="input-field" value={issueForm.memberId}
                  onChange={e => setIssueForm(p => ({ ...p, memberId: e.target.value }))} required>
                  <option value="">— Select active member —</option>
                  {activeMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.memberId})</option>
                  ))}
                </select>
              </div>

              {issueMode === 'single' ? (
                <div>
                  <label style={labelStyle}>📚 Selected Book *</label>
                  <select className="input-field" value={issueForm.bookId}
                    onChange={e => setIssueForm(p => ({ ...p, bookId: e.target.value }))} required={issueMode === 'single'}>
                    <option value="">— Select available book —</option>
                    {availableBooks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} — {b.author} ({b.available} available)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>📚 Select Multiple Books *</label>
                  <div style={{
                    maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', 
                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                    padding: '8px'
                  }}>
                    {availableBooks.map(b => (
                      <div 
                        key={b.id} 
                        onClick={() => toggleBookSelection(b.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                          borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                          background: issueForm.bookIds.includes(b.id) ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                          marginBottom: '2px'
                        }}
                      >
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '4px', border: '2px solid',
                          borderColor: issueForm.bookIds.includes(b.id) ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                          background: issueForm.bookIds.includes(b.id) ? '#fbbf24' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {issueForm.bookIds.includes(b.id) && <span style={{ color: '#000', fontSize: '12px', fontWeight: 900 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: issueForm.bookIds.includes(b.id) ? '#fff' : '#d4d4d8', fontSize: '13px', fontWeight: 700 }}>{b.title}</div>
                          <div style={{ color: '#71717a', fontSize: '11px' }}>{b.author} · {b.available} available</div>
                        </div>
                      </div>
                    ))}
                    {availableBooks.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#71717a', fontSize: '13px' }}>No books available</div>
                    )}
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#71717a', fontWeight: 600 }}>{issueForm.bookIds.length} books selected</span>
                    <button type="button" onClick={() => setIssueForm(p => ({ ...p, bookIds: [] }))} style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>Clear All</button>
                  </div>
                </div>
              )}

              <div style={{
                background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)',
                borderRadius: '14px', padding: '20px', fontSize: '13px', color: '#71717a', lineHeight: 1.8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Max Borrowing Limit</span>
                  <span style={{ color: '#fbbf24', fontWeight: 800 }}>5 Books Total</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Loan Period</span>
                  <span style={{ color: '#fbbf24', fontWeight: 800 }}>14 Days</span>
                </div>
              </div>

              <button type="submit" className="btn-primary"
                disabled={submitting || !issueForm.memberId || (issueMode === 'single' ? !issueForm.bookId : issueForm.bookIds.length === 0)}
                style={{ width: '100%', padding: '16px', fontSize: '16px' }}>
                {submitting ? 'Processing...' : `Authorize ${issueMode === 'multiple' ? 'Issues' : 'Issue'}`}
              </button>
            </form>
          </div>

          {/* Currently Active Borrows Summary */}
          <div className="glass-card fade-up" style={{ padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
               <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>Active Loans</h2>
               <span className="badge badge-active">{activeList.length}</span>
            </div>
            
            {activeList.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#52525b', padding: '40px 0', fontSize: '15px' }}>
                No active loans found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto' }}>
                {activeList.map(tx => {
                  const overdue = isOverdue(tx.dueDate)
                  return (
                    <div key={tx.id} style={{
                      padding: '16px 20px',
                      borderRadius: '14px',
                      background: overdue ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)',
                      border: overdue ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '15px' }}>{tx.bookTitle}</div>
                      <div style={{ color: '#71717a', fontSize: '13px', marginTop: '4px', fontWeight: 600 }}>
                        {tx.memberName} · <span style={{ color: '#f59e0b' }}>{tx.memberCode}</span>
                      </div>
                      <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: overdue ? '#ef4444' : '#52525b', textTransform: 'uppercase' }}>
                         Due Date: {fmtDate(tx.dueDate)} {overdue && `(${daysOverdue(tx.dueDate)}d overdue)`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Return Book Tab ───────────────────────────────────────────────────── */}
      {tab === 'return' && (
        <div className="glass-card fade-up" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '28px' }}>
             <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>Process Return</h2>
             <p style={{ color: '#71717a', fontSize: '14px', marginTop: '4px' }}>Identify an active loan to record the return.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>Syncing data...</div>
          ) : activeList.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>
              All books are currently in the library.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Book</th><th>Member</th><th>ID</th>
                    <th>Issued On</th><th>Due Date</th><th>Penalty</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeList.map(tx => {
                    const overdue   = isOverdue(tx.dueDate)
                    const days      = daysOverdue(tx.dueDate)
                    const estFine   = days * 5
                    return (
                      <tr key={tx.id}>
                        <td style={{ color: '#f8fafc', fontWeight: 800 }}>{tx.bookTitle}</td>
                        <td style={{ color: '#d4d4d8' }}>{tx.memberName}</td>
                        <td>
                          <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>
                            {tx.memberCode}
                          </span>
                        </td>
                        <td style={{ color: '#a1a1aa', fontSize: '14px' }}>{fmtDate(tx.issuedAt)}</td>
                        <td>
                          <div style={{ color: overdue ? '#ef4444' : '#a1a1aa', fontSize: '14px', fontWeight: overdue ? 800 : 400 }}>
                            {fmtDate(tx.dueDate)}
                          </div>
                          {overdue && (
                            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', fontWeight: 700 }}>
                              {days}d overdue
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ color: estFine > 0 ? '#ef4444' : '#f59e0b', fontWeight: 900 }}>
                            {estFine > 0 ? `₹${estFine}` : '₹0'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-primary"
                            disabled={submitting}
                            onClick={() => handleReturn(tx.id, tx.bookTitle, estFine)}
                            style={{ padding: '7px 16px', fontSize: '13px' }}
                          >
                            📥 Return
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Pending Requests Tab ──────────────────────────────────────────────── */}
      {tab === 'requests' && (
        <div className="glass-card fade-up" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '28px' }}>
             <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>Pending Reservations</h2>
             <p style={{ color: '#71717a', fontSize: '14px', marginTop: '4px' }}>Members are waiting for approval to borrow these books.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>Fetching requests...</div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>
              No pending requests at the moment.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Book</th><th>Member</th><th>ID</th>
                    <th>Days</th><th>Requested On</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td style={{ color: '#f8fafc', fontWeight: 800 }}>{req.bookTitle}</td>
                      <td style={{ color: '#d4d4d8' }}>{req.memberName}</td>
                      <td>
                        <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>
                          {req.memberCode}
                        </span>
                      </td>
                      <td style={{ color: '#f59e0b', fontWeight: 800 }}>{req.requestedDays}d</td>
                      <td style={{ color: '#a1a1aa', fontSize: '14px' }}>{fmtDate(req.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            className="btn-primary"
                            disabled={submitting}
                            onClick={() => handleApprove(req.id)}
                            style={{ padding: '7px 16px', fontSize: '13px' }}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-danger"
                            disabled={submitting}
                            onClick={() => handleReject(req.id)}
                            style={{ padding: '7px 16px', fontSize: '13px' }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
