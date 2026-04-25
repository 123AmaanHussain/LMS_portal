import React from 'react'

/**
 * Stat card with gradient icon, glow decoration, and large value display.
 */
export default function StatCard({ title, value, icon, gradient, subtitle }) {
  return (
    <div className="glass-card fade-up" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-24px', right: '-24px',
        width: '100px', height: '100px', borderRadius: '50%',
        background: gradient, opacity: 0.1, filter: 'blur(25px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            color: '#71717a', fontSize: '12px', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px',
          }}>
            {title}
          </p>
          <p style={{
            fontSize: '36px', fontWeight: 800, lineHeight: 1,
            background: gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {value ?? <span style={{ fontSize: '28px', opacity: 0.4 }}>—</span>}
          </p>
          {subtitle && (
            <p style={{ color: '#52525b', fontSize: '12px', marginTop: '8px' }}>{subtitle}</p>
          )}
        </div>

        <div style={{
          width: '50px', height: '50px', flexShrink: 0,
          background: gradient,
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
          opacity: 0.9,
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        }}>
          {icon}
        </div>
      </div>
    </div>
  )
}
