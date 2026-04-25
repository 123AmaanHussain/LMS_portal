import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

/**
 * Auth provider — manages user session state.
 * Persists token/role/user in localStorage so page refresh doesn't log out.
 */
export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [token, setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('library_session')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed)
        setToken(parsed.token)
      } catch { /* ignore corrupt data */ }
    }
    setLoading(false)
  }, [])

  const login = useCallback((sessionData) => {
    setUser(sessionData)
    setToken(sessionData.token)
    localStorage.setItem('library_session', JSON.stringify(sessionData))
  }, [])

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        })
      } catch { /* ignore network errors during logout */ }
    }
    setUser(null)
    setToken(null)
    localStorage.removeItem('library_session')
  }, [token])

  const isAdmin  = user?.role === 'ADMIN'
  const isMember = user?.role === 'MEMBER'
  const isLoggedIn = !!token

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAdmin, isMember, isLoggedIn,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook to access auth state from any component. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
