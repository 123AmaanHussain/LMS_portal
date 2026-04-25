import React, { useEffect, useState } from 'react'
import { getProfile } from '../api/libraryApi'
import { useAuth } from '../context/AuthContext'

const fmtDate = (str) =>
  str ? new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date()

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', color: '#52525b', padding: '100px 0', fontSize: '16px', fontWeight: 600 }}>
      Accessing your library profile...
    </div>
  )

  if (error) return (
    <div className="alert-error">⚠️ {error}</div>
  )

  if (!profile) return null

  return (
    <div className="reveal">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Welcome back, {profile.name || user?.username}! Here is your library activity.</p>
      </div>

      {/* ── Personal Info Card ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '14px', 
              background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
            }}>👤</div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Personal Information
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <InfoRow label="Member ID" value={profile.memberId} highlight />
            <InfoRow label="Full Name" value={profile.name} />
            <InfoRow label="Email Address" value={profile.email} />
            <InfoRow label="Contact Number" value={profile.phone || 'Not provided'} />
            <InfoRow label="Membership Date" value={fmtDate(profile.joinedAt)} />
            <InfoRow label="Days Until Expiry" value={profile.expiresInDays !== undefined ? `${profile.expiresInDays} days` : 'Calculating...'} />
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
               <InfoRow 
                 label="Account Status" 
                 value={profile.isActive ? '✅ Active' : '❌ Suspended'} 
                 valueColor={profile.isActive ? '#10b981' : '#ef4444'} 
               />
            </div>
          </div>
        </div>

        {/* ── Stats Card ─────────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '32px' }}>
            📊 Reading Statistics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <StatBox icon="📚" label="Current Loans" value={profile.activeCount || 0}
              color="#f59e0b" />
            <StatBox icon="✅" label="Total Returned" value={profile.returnedCount || 0}
              color="#10b981" />
            <StatBox icon="💰" label="Fines Paid" value={`₹${profile.totalFines || 0}`}
              color={profile.totalFines > 0 ? '#ef4444' : '#10b981'} />
            <StatBox icon="📖" label="Total Books"
              value={(profile.activeCount || 0) + (profile.returnedCount || 0)}
              color="#fbbf24" />
          </div>
        </div>
      </div>

      {/* ── Reservation Requests ────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>
          🔔 Reservation Requests ({profile.requests?.length || 0})
        </h2>
        {(!profile.requests || profile.requests.length === 0) ? (
          <div style={{ textAlign: 'center', color: '#3f3f46', padding: '40px 0', fontSize: '15px' }}>
            No pending or past reservations.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Book</th><th>Days</th><th>Requested On</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {profile.requests.map(req => (
                  <tr key={req.id}>
                    <td style={{ color: '#f8fafc', fontWeight: 700 }}>{req.bookTitle}</td>
                    <td style={{ color: '#f59e0b', fontWeight: 800 }}>{req.requestedDays}d</td>
                    <td style={{ color: '#a1a1aa', fontSize: '13px' }}>{fmtDate(req.createdAt)}</td>
                    <td>
                      <span className={`badge badge-${req.status.toLowerCase()}`} style={{ fontSize: '11px' }}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Currently Borrowed Books ────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>
          Currently Borrowed ({profile.activeBooks?.length || 0})
        </h2>
        {(!profile.activeBooks || profile.activeBooks.length === 0) ? (
          <div style={{ textAlign: 'center', color: '#3f3f46', padding: '40px 0', fontSize: '15px' }}>
            You don't have any books checked out right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {profile.activeBooks.map(book => {
              const overdue = isOverdue(book.dueDate)
              return (
                <div key={book.transactionId} style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: overdue ? 'rgba(239,68,68,0.05)' : 'rgba(245, 158, 11, 0.03)',
                  border: overdue ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(245, 158, 11, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {overdue && <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '10px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚠️ Overdue</div>}
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>{book.title}</div>
                  <div style={{ color: '#71717a', fontSize: '13px', fontWeight: 600 }}>
                    by {book.author}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                       <span style={{ color: '#52525b', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Issued</span>
                       <span style={{ color: '#f8fafc', fontSize: '12px', fontWeight: 600 }}>{fmtDate(book.issuedAt)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
                       <span style={{ color: overdue ? '#ef4444' : '#52525b', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Due Date</span>
                       <span style={{ color: overdue ? '#ef4444' : '#f8fafc', fontSize: '12px', fontWeight: 700 }}>{fmtDate(book.dueDate)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Borrowing History ───────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>
          📜 Borrowing History
        </h2>
        {(!profile.history || profile.history.length === 0) ? (
          <div style={{ textAlign: 'center', color: '#52525b', padding: '40px 0' }}>
            No transaction history available.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Book Title</th><th>Author</th>
                  <th>Issued</th><th>Returned</th><th>Fine</th>
                </tr>
              </thead>
              <tbody>
                {profile.history.map(tx => (
                  <tr key={tx.transactionId}>
                    <td style={{ color: '#f8fafc', fontWeight: 700 }}>{tx.title}</td>
                    <td style={{ color: '#71717a' }}>{tx.author}</td>
                    <td style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: 600 }}>{fmtDate(tx.issuedAt)}</td>
                    <td style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: 600 }}>{fmtDate(tx.returnedAt)}</td>
                    <td>
                      <span className={tx.fineAmount > 0 ? 'badge-overdue badge' : 'badge-returned badge'} style={{ fontSize: '11px' }}>
                        {tx.fineAmount > 0 ? `₹${tx.fineAmount}` : 'No fine'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helper Components ────────────────────────────────────────────────────────
function InfoRow({ label, value, highlight, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#52525b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{
        color: valueColor || (highlight ? '#fbbf24' : '#f8fafc'),
        fontSize: highlight ? '16px' : '14px',
        fontWeight: highlight ? 900 : 600,
        fontFamily: highlight ? 'monospace' : 'inherit',
      }}>{value}</span>
    </div>
  )
}

function StatBox({ icon, label, value, color }) {
  return (
    <div style={{
      padding: '24px',
      borderRadius: '16px',
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.03)',
      textAlign: 'center',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ fontSize: '24px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ color, fontSize: '26px', fontWeight: 900, letterSpacing: '-1px' }}>{value}</div>
      <div style={{ color: '#52525b', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '8px' }}>{label}</div>
    </div>
  )
}
