/**
 * Centralized API layer — all fetch calls to the Java backend.
 * The Vite proxy forwards /api/* to http://localhost:9090.
 * Attaches Bearer token from localStorage for authenticated requests.
 */

const BASE = '/api'

/** Retrieves the auth token from localStorage. */
const getToken = () => {
  try {
    const session = localStorage.getItem('library_session')
    return session ? JSON.parse(session).token : null
  } catch { return null }
}

const req = async (url, options = {}) => {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { headers, ...options })
  const data = await res.json()

  if (!res.ok) {
    // If unauthorized, clear session and redirect to login
    if (res.status === 401) {
      localStorage.removeItem('library_session')
      window.location.href = '/login'
      throw new Error('Session expired. Please log in again.')
    }
    throw new Error(data.error || `Request failed with status ${res.status}`)
  }
  return data
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginApi = (body) =>
  req(`${BASE}/auth/login`, { method: 'POST', body: JSON.stringify(body) })

export const logoutApi = () =>
  req(`${BASE}/auth/logout`, { method: 'POST' })

export const getMe = () => req(`${BASE}/auth/me`)

// ─── Profile ──────────────────────────────────────────────────────────────────
export const getProfile = () => req(`${BASE}/profile`)

// ─── Books ────────────────────────────────────────────────────────────────────
export const getBooks        = (search = '') =>
  req(`${BASE}/books${search ? `?q=${encodeURIComponent(search)}` : ''}`)

export const addBook         = (book)        =>
  req(`${BASE}/books`,       { method: 'POST',   body: JSON.stringify(book) })

export const updateBook      = (id, book)    =>
  req(`${BASE}/books/${id}`, { method: 'PUT',    body: JSON.stringify(book) })

export const deleteBook      = (id)          =>
  req(`${BASE}/books/${id}`, { method: 'DELETE' })

// ─── Members ──────────────────────────────────────────────────────────────────
export const getMembers      = (search = '') =>
  req(`${BASE}/members${search ? `?q=${encodeURIComponent(search)}` : ''}`)

export const addMember       = (member)      =>
  req(`${BASE}/members`,       { method: 'POST',   body: JSON.stringify(member) })

export const updateMember    = (id, member)  =>
  req(`${BASE}/members/${id}`, { method: 'PUT',    body: JSON.stringify(member) })

export const deleteMember    = (id)          =>
  req(`${BASE}/members/${id}`, { method: 'DELETE' })

// ─── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions       = () => req(`${BASE}/transactions`)
export const getActiveTransactions = () => req(`${BASE}/transactions/active`)
export const getOverdueTransactions= () => req(`${BASE}/transactions/overdue`)

export const issueBook  = (bookId, memberId)  =>
  req(`${BASE}/transactions/issue`,  { method: 'POST', body: JSON.stringify({ bookId, memberId }) })

export const returnBook = (transactionId)     =>
  req(`${BASE}/transactions/return`, { method: 'POST', body: JSON.stringify({ transactionId }) })

export const getTransactionReceipt = (transactionId) =>
  req(`${BASE}/transactions/${transactionId}/receipt`)


// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = () => req(`${BASE}/dashboard`)

// ─── Reservations ─────────────────────────────────────────────────────────────
export const getRequests     = () => req(`${BASE}/requests`)
export const createRequest   = (body) => req(`${BASE}/requests`, { method: 'POST', body: JSON.stringify(body) })
export const approveRequest  = (id)   => req(`${BASE}/requests/${id}/approve`, { method: 'PUT' })
export const rejectRequest   = (id)   => req(`${BASE}/requests/${id}/reject`, { method: 'PUT' })
