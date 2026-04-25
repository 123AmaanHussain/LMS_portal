import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Books from './pages/Books'
import Members from './pages/Members'
import Transactions from './pages/Transactions'
import Profile from './pages/Profile'
import Rules from './pages/Rules'
import Login from './pages/Login'

/** Protects routes — redirects to /login if not authenticated. */
function ProtectedRoute({ children, adminOnly }) {
  const { isLoggedIn, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/profile" replace />
  return children
}

import bgImage from './assets/premium_library_bg.png'

/** Layout with sidebar for authenticated users. */
function AppLayout() {
  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: `#0a0a0b url(${bgImage}) center/cover fixed no-repeat`,
      position: 'relative'
    }}>
      {/* Dark Parallax Overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(10,10,11,0.8) 0%, rgba(10,10,11,0.95) 100%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div style={{ zIndex: 1, display: 'flex', width: '100%' }}>
        <Sidebar />
        <main style={{
          flex: 1,
          padding: '32px 36px',
          overflowY: 'auto',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1
        }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>
            } />
            <Route path="/books" element={
              <ProtectedRoute><Books /></ProtectedRoute>
            } />
            <Route path="/members" element={
              <ProtectedRoute adminOnly><Members /></ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute adminOnly><Transactions /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/rules" element={
              <ProtectedRoute><Rules /></ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginGuard />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

/** If already logged in, redirect away from login page. */
function LoginGuard() {
  const { isLoggedIn, isAdmin, loading } = useAuth()
  if (loading) return null
  if (isLoggedIn) return <Navigate to={isAdmin ? '/dashboard' : '/profile'} replace />
  return <Login />
}
