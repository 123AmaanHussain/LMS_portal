import React, { useEffect, useState, useCallback } from 'react'
import { getMembers, addMember, updateMember, deleteMember } from '../api/libraryApi'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { exportToCsv } from '../utils/exportCsv'

// ─── Member Form ──────────────────────────────────────────────────────────────
function MemberForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', isActive: true, password: '',
    ...initialData,
  })

  const set = (field) => (e) =>
    setForm(prev => ({
      ...prev,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form) }

  const labelStyle = {
    display: 'block', color: '#71717a', fontSize: '11px',
    fontWeight: 800, marginBottom: '8px',
    textTransform: 'uppercase', letterSpacing: '0.1em',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <label style={labelStyle}>Full Legal Name *</label>
        <input className="input-field" value={form.name} onChange={set('name')}
          placeholder="e.g. Rahul Sharma" required />
      </div>
      <div>
        <label style={labelStyle}>Official Email Address *</label>
        <input className="input-field" type="email" value={form.email} onChange={set('email')}
          placeholder="rahul@example.com" required />
      </div>
      <div>
        <label style={labelStyle}>Contact Number</label>
        <input className="input-field" type="tel" value={form.phone || ''} onChange={set('phone')}
          placeholder="+91 98765 43210" />
      </div>

      {/* Only show active toggle when editing */}
      {initialData?.id && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
          <input
            type="checkbox" id="isActive" checked={form.isActive} onChange={set('isActive')}
            style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }}
          />
          <span style={{ color: '#d4d4d8', fontSize: '14px', fontWeight: 600 }}>Account Active</span>
        </label>
      )}

      {!initialData?.id && (
        <>
          <div>
            <label style={labelStyle}>Initial Password *</label>
            <input className="input-field" type="password" value={form.password} onChange={set('password')}
              placeholder="Leave blank for 'library123'" />
          </div>
          <div style={{
            background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)',
            borderRadius: '12px', padding: '16px', fontSize: '13px', color: '#71717a', lineHeight: 1.6
          }}>
            ✨ Member ID will be auto-generated upon registration (e.g. <strong style={{ color: '#f59e0b' }}>LIB-004</strong>)
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Processing...' : (initialData?.id ? 'Update Record' : 'Complete Registration')}
        </button>
      </div>
    </form>
  )
}

// ─── Members Page ─────────────────────────────────────────────────────────────
export default function Members() {
  const toast  = useToast()
  const [members, setMembers]        = useState([])
  const [loading, setLoading]        = useState(true)
  const [search, setSearch]          = useState('')
  const [showAdd, setShowAdd]        = useState(false)
  const [editMember, setEditMember]  = useState(null)
  const [submitting, setSubmitting]  = useState(false)

  const fetchMembers = useCallback(async (q = search) => {
    setLoading(true)
    try   { setMembers(await getMembers(q)) }
    catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [search, toast])

  useEffect(() => { fetchMembers('') }, [fetchMembers])

  useEffect(() => {
    const t = setTimeout(() => fetchMembers(search), 300)
    return () => clearTimeout(t)
  }, [search, fetchMembers])

  const handleAdd = async (data) => {
    setSubmitting(true)
    try   { await addMember(data); toast('Member registered!'); setShowAdd(false); fetchMembers() }
    catch (e) { toast(e.message, 'error') }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (data) => {
    setSubmitting(true)
    try   { await updateMember(data.id || editMember.id, data); toast('Member updated!'); setEditMember(null); fetchMembers() }
    catch (e) { toast(e.message, 'error') }
    finally { setSubmitting(false) }
  }

  const handleToggleActive = async (m) => {
    try {
      const action = m.isActive ? 'suspended' : 'reactivated'
      await updateMember(m.id, { ...m, isActive: !m.isActive })
      toast(`Member ${action} successfully.`)
      fetchMembers()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const handleDelete = async (m) => {
    if (!window.confirm(`Remove "${m.name}" from the system? This cannot be undone.`)) return
    try   { await deleteMember(m.id); toast('Member removed.'); fetchMembers() }
    catch (e) { toast(e.message, 'error') }
  }

  const fmtDate = (str) =>
    str ? new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="reveal">
      <div className="page-header">
        <h1>Member Registry</h1>
        <p>Maintain the community of library patrons and access privileges.</p>
      </div>

      <div className="glass-card" style={{ padding: '32px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: '1', minWidth: '240px', maxWidth: '400px' }}>
            <svg className="icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="input-field" type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patrons by name or ID…" />
          </div>
          <button className="btn-secondary" onClick={() => exportToCsv(
            'members.csv', members,
            ['memberId', 'name', 'email', 'phone', 'isActive'],
            ['Member ID', 'Name', 'Email', 'Phone', 'Active']
          )} disabled={members.length === 0}>
             <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Export
          </button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Register Patron
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>Accessing registry...</div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#52525b', padding: '60px 0', fontSize: '15px' }}>
            {search ? 'No patron records found.' : 'The registry is currently empty.'}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patron ID</th><th>Full Name</th><th>Email</th>
                  <th>Joined Date</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '14px', fontWeight: 800 }}>
                        {m.memberId}
                      </span>
                    </td>
                    <td style={{ color: '#f8fafc', fontWeight: 800 }}>{m.name}</td>
                    <td style={{ color: '#d4d4d8' }}>{m.email}</td>
                    <td style={{ color: '#71717a', fontSize: '14px', fontWeight: 600 }}>{fmtDate(m.joinedAt)}</td>
                    <td>
                      <span className={`badge ${m.isActive ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {m.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setEditMember(m)}>Edit</button>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '8px 16px', color: m.isActive ? '#f59e0b' : '#10b981', borderColor: m.isActive ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)' }} 
                          onClick={() => handleToggleActive(m)}
                        >
                          {m.isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                        <button className="btn-danger" style={{ padding: '8px 16px' }} onClick={() => handleDelete(m)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '24px', color: '#52525b', fontSize: '14px', fontWeight: 600 }}>
          {members.length} registered patron{members.length !== 1 ? 's' : ''}
        </div>
      </div>

      {showAdd && (
        <Modal title="Register New Patron" onClose={() => setShowAdd(false)}>
          <MemberForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} loading={submitting} />
        </Modal>
      )}
      {editMember && (
        <Modal title="Update Patron Details" onClose={() => setEditMember(null)}>
          <MemberForm initialData={editMember} onSubmit={handleEdit}
            onCancel={() => setEditMember(null)} loading={submitting} />
        </Modal>
      )}
    </div>
  )
}
