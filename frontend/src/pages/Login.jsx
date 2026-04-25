import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginApi } from '../api/libraryApi'

// Import the generated background image
import bgImage from '../assets/premium_library_bg.png'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [role, setRole]         = useState('ADMIN')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [memberId, setMemberId] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let body
      if (role === 'ADMIN') {
        body = { role: 'ADMIN', username, password }
      } else {
        body = { role: 'MEMBER', memberId, password }
      }

      const session = await loginApi(body)
      login(session)
      navigate(role === 'ADMIN' ? '/dashboard' : '/profile', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `#0a0a0b url(${bgImage}) center/cover no-repeat`,
      position: 'relative',
      padding: '20px',
    }}>
      {/* Dark Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at center, rgba(10,10,11,0.5) 0%, rgba(10,10,11,0.95) 100%)',
        zIndex: 1,
      }} />

      <div className="reveal" style={{
        width: '100%',
        maxWidth: '1040px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        minHeight: '620px',
        background: 'rgba(18, 18, 20, 0.65)',
        backdropFilter: 'blur(30px) saturate(150%)',
        borderRadius: '32px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.02)',
        zIndex: 10,
      }}>
        
        {/* Left Panel: Branding & Content */}
        <div style={{
          padding: '70px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, transparent 100%)',
          borderRight: '1px solid rgba(255,255,255,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
            <div className="glow" style={{
              width: '56px', height: '56px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>LibraryMS</span>
          </div>

          <h2 style={{ fontSize: '46px', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1.5px' }}>
            Elevate Your <br/> <span style={{ color: '#f59e0b' }}>Library Experience</span> with Precision.
          </h2>
          
          <p style={{ color: '#a1a1aa', fontSize: '18px', lineHeight: 1.6, marginBottom: '48px', maxWidth: '400px' }}>
            Manage a vast digital collection and track progress seamlessly through our premium resource management suite.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <Feature icon="⚡" title="Real-time Stats" desc="Live monitoring of all library activities." />
            <Feature icon="🛡️" title="Secure Access" desc="Role-based security for peace of mind." />
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div style={{ padding: '60px 50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '36px' }}>
            <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '-0.5px' }}>Welcome Back</h3>
            <p style={{ color: '#71717a', fontSize: '15px' }}>Select your role to sign in to the portal</p>
          </div>

          {/* Role Toggle */}
          <div style={{
            display: 'flex', gap: '6px', marginBottom: '32px',
            background: 'rgba(9, 9, 11, 0.6)', borderRadius: '16px', padding: '6px',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            {['ADMIN', 'MEMBER'].map(r => (
              <button key={r} onClick={() => { setRole(r); setError('') }} style={{
                flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: 800,
                background: role === r ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                color: role === r ? '#fff' : '#71717a',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: role === r ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none',
              }}>
                {r === 'ADMIN' ? 'System Admin' : 'Member Hub'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '14px', padding: '16px',
              color: '#fca5a5', fontSize: '14px', marginBottom: '24px', fontWeight: 500,
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {role === 'ADMIN' ? (
              <>
                <InputGroup label="Admin Username" value={username} onChange={setUsername} placeholder="admin" autoFocus />
                <InputGroup label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
              </>
            ) : (
              <>
                <InputGroup label="Member ID" value={memberId} onChange={v => setMemberId(v.toUpperCase())} placeholder="LIB-001" autoFocus />
                <InputGroup label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
              </>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '16px', fontSize: '16px', marginTop: '8px' }}>
              {loading ? 'Authenticating...' : 'Sign In Securely'}
            </button>
          </form>

          <div style={{ marginTop: '36px', textAlign: 'center' }}>
            <span style={{ color: '#52525b', fontSize: '13px', fontWeight: 500 }}>
              Built for <span style={{ color: '#fbbf24', fontWeight: 700 }}>Advanced Academic Management</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function InputGroup({ label, value, onChange, placeholder, type = 'text', autoFocus }) {
  return (
    <div>
      <label style={{ display: 'block', color: '#71717a', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
        {label}
      </label>
      <input
        className="input-field"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        autoFocus={autoFocus}
      />
    </div>
  )
}

function Feature({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <div style={{ fontSize: '20px' }}>{icon}</div>
      <div>
        <div style={{ color: '#e4e4e7', fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{title}</div>
        <div style={{ color: '#52525b', fontSize: '12px', lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>
  )
}

