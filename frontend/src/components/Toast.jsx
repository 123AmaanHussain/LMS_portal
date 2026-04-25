import React, { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

const COLORS = {
  success: { border: 'rgba(16,185,129,0.4)', icon: '✓', iconColor: '#10b981' },
  error:   { border: 'rgba(239,68,68,0.4)',  icon: '✗', iconColor: '#ef4444' },
  warning: { border: 'rgba(245,158,11,0.4)', icon: '⚠', iconColor: '#f59e0b' },
  info:    { border: 'rgba(59,130,246,0.4)', icon: 'ℹ', iconColor: '#3b82f6' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div style={{
        position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const style = COLORS[t.type] || COLORS.info
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 20px',
              background: 'rgba(10, 10, 11, 0.85)',
              border: `1px solid ${style.border}`,
              color: '#f8fafc',
              borderRadius: '24px',
              fontSize: '14px', fontWeight: 600,
              minWidth: '280px', maxWidth: '420px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
              animation: 'toastIsland 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              backdropFilter: 'blur(16px)',
              pointerEvents: 'auto',
            }}>
              <span style={{ fontSize: '16px', color: style.iconColor, flexShrink: 0 }}>{style.icon}</span>
              <span style={{ lineHeight: 1.4 }}>{t.message}</span>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes toastIsland {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
