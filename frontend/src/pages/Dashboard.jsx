import React, { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import { getDashboardStats } from '../api/libraryApi'

const fmt = (str) =>
  str ? new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const getStatusBadge = (status, dueDate) => {
  if (status === 'RETURNED') return { cls: 'badge badge-returned', label: 'Returned' }
  if (new Date(dueDate) < new Date()) return { cls: 'badge badge-overdue', label: 'Overdue' }
  return { cls: 'badge badge-issued', label: 'Issued' }
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const CARDS = [
    {
      title: 'Total Books',
      value: stats?.totalBooks,
      icon: '📚',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      subtitle: 'In library collection',
    },
    {
      title: 'Active Members',
      value: stats?.totalMembers,
      icon: '👥',
      gradient: 'linear-gradient(135deg, #a1a1aa, #71717a)',
      subtitle: 'Registered members',
    },
    {
      title: 'Active Issues',
      value: stats?.activeIssues,
      icon: '📋',
      gradient: 'linear-gradient(135deg, #ffffff, #a1a1aa)',
      subtitle: 'Books currently issued',
    },
    {
      title: 'Overdue',
      value: stats?.overdueCount,
      icon: '⚠️',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      subtitle: stats?.overdueCount > 0 ? 'Require attention!' : 'All books on time ✓',
    },
    {
      title: 'Fines Collected',
      value: stats?.totalFineCollected != null ? `₹${stats.totalFineCollected}` : '₹0',
      icon: '💰',
      gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      subtitle: 'Total revenue from fines',
    },
  ]

  return (
    <div className="reveal">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Real-time library metrics and recent activity tracking.</p>
      </div>

      {error && (
        <div className="alert-error">
          ⚠️ {error}. Ensure the Java backend is active.
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px',
        marginBottom: '40px',
      }}>
        {CARDS.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Recent Transactions */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>Recent Activity</h2>
            <p style={{ color: '#71717a', fontSize: '14px', marginTop: '4px' }}>Latest book issuances and returns</p>
          </div>
          {stats?.returnedToday > 0 && (
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              padding: '8px 16px', 
              borderRadius: '12px', 
              color: '#fbbf24', 
              fontSize: '13px', 
              fontWeight: 800,
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              ✨ {stats.returnedToday} returned today
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>Loading transaction data...</div>
        ) : !stats?.recentTransactions?.length ? (
          <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>
            No recent activity detected.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Member</th>
                  <th>Member ID</th>
                  <th>Issued</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Fine</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map(tx => {
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
                      <td style={{ color: '#a1a1aa', fontSize: '14px' }}>{fmt(tx.issuedAt)}</td>
                      <td style={{ color: '#a1a1aa', fontSize: '14px' }}>{fmt(tx.dueDate)}</td>
                      <td><span className={badge.cls}>{badge.label}</span></td>
                      <td style={{ 
                        color: tx.fineAmount > 0 ? '#ef4444' : '#71717a', 
                        fontWeight: tx.fineAmount > 0 ? 800 : 500 
                      }}>
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
    </div>
  )
}
