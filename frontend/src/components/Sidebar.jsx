import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ADMIN_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { path: '/books', label: 'Books', icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )},
  { path: '/members', label: 'Members', icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <circle cx="19" cy="7" r="3"/>
      <path d="M21 21v-1.5a3 3 0 0 0-2-2.83"/>
    </svg>
  )},
  { path: '/transactions', label: 'Issue / Return', icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )},
]

const MEMBER_NAV = [
  { path: '/profile', label: 'My Profile', icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="5"/>
      <path d="M20 21a8 8 0 0 0-16 0"/>
    </svg>
  )},
  { path: '/books', label: 'Browse Books', icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )},
  { path: '/rules', label: 'Library Rules', icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  )},
]

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = isAdmin ? ADMIN_NAV : MEMBER_NAV

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside style={{
      width: '256px',
      minWidth: '256px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0b 0%, #000000 100%)',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      padding: '28px 16px',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
      zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{ padding: '0 8px', marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.4px' }}>
              LibraryMS
            </div>
            <div style={{ fontSize: '10px', color: '#71717a', fontWeight: 800, letterSpacing: '0.1em' }}>
              PREMIUM HUB
            </div>
          </div>
        </div>
      </div>

      {/* User Badge */}
      <div style={{
        padding: '16px 18px', marginBottom: '28px',
        background: 'rgba(24, 24, 27, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        borderRadius: '16px',
      }}>
        <div style={{ color: '#f8fafc', fontSize: '14px', fontWeight: 700 }}>
          {user?.username || user?.name || 'User'}
        </div>
        <div style={{
          display: 'inline-block', marginTop: '6px',
          padding: '2px 10px', borderRadius: '8px',
          fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em',
          background: isAdmin
            ? 'rgba(239, 68, 68, 0.1)'
            : 'rgba(245, 158, 11, 0.1)',
          color: isAdmin ? '#f87171' : '#fbbf24',
          border: isAdmin
            ? '1px solid rgba(239, 68, 68, 0.2)'
            : '1px solid rgba(245, 158, 11, 0.2)',
        }}>
          {isAdmin ? 'SYSTEM ADMIN' : user?.memberId || 'MEMBER'}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '11px', color: '#52525b', fontWeight: 800, letterSpacing: '0.15em', padding: '0 14px', marginBottom: '12px' }}>
          MAIN NAVIGATION
        </div>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '14px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#fff' : '#71717a',
              background: isActive
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))'
                : 'transparent',
              border: isActive
                ? '1px solid rgba(245, 158, 11, 0.2)'
                : '1px solid transparent',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ 
                  flexShrink: 0, display: 'flex', 
                  color: isActive ? '#fbbf24' : 'inherit' 
                }}>{item.icon}</span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <button onClick={handleLogout} style={{
        marginTop: '20px',
        padding: '14px',
        background: 'rgba(239, 68, 68, 0.04)',
        border: '1px solid rgba(239, 68, 68, 0.1)',
        borderRadius: '14px',
        color: '#f87171',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sign Out
      </button>

      {/* Footer */}
      <div style={{
        marginTop: '16px',
        padding: '16px',
        background: 'rgba(30, 41, 59, 0.2)',
        border: '1px solid rgba(148, 163, 184, 0.05)',
        borderRadius: '16px',
        textAlign: 'center',
      }}>
        <div style={{ color: '#475569', fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em' }}>
          v1.2.0 · ENTERPRISE
        </div>
      </div>
    </aside>
  )
}
