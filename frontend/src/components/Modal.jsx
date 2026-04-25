import React, { useEffect } from 'react'

/**
 * Reusable modal dialog with escape + backdrop dismiss.
 */
export default function Modal({ title, children, onClose, size = 'md' }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const widths = { sm: '400px', md: '520px', lg: '680px' }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Dialog */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: widths[size],
        background: '#131318',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        borderRadius: '20px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.7), 0 0 40px rgba(16,185,129,0.08)',
        animation: 'modalIn 0.22s ease',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid rgba(16,185,129,0.06)',
        }}>
          <h2 style={{ color: '#e4e4e7', fontSize: '17px', fontWeight: 700 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.12)',
              borderRadius: '8px',
              color: '#71717a',
              cursor: 'pointer',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', lineHeight: 1,
              transition: 'all 0.15s',
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
      `}</style>
    </div>
  )
}
