// src/components/users/CreateUserModal.jsx

'use client'

import { useState } from 'react'

const ALL_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'account_manager', label: 'Account Manager' },
  { value: 'designer', label: 'Designer' },
  { value: 'copywriter', label: 'Copywriter' },
  { value: 'motion_designer', label: 'Motion Designer' },
  { value: 'strategist', label: 'Strategist' },
]

const AM_ROLES = ALL_ROLES.filter((r) => r.value !== 'admin')

export default function CreateUserModal({ onClose, onCreated, creatorRole }) {
  const availableRoles = creatorRole === 'admin' ? ALL_ROLES : AM_ROLES

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: availableRoles[0].value,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      onCreated(data.user)
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e8e4ff',
    fontSize: '14px',
    color: '#1e1b4b',
    background: '#faf9ff',
    outline: 'none',
    transition: 'border 0.15s',
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(26,10,46,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: '#ffffff',
          border: '1px solid #e8e4ff',
          boxShadow: '0 24px 64px rgba(124,58,237,0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: '#ede9fe' }}
            >
              👤
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#1e1b4b' }}>
                Create new user
              </h2>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                Share credentials with the team member
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all"
            style={{ color: '#9ca3af', background: '#f3f1ff' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
              Full name
            </label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Sara Ahmed"
              style={inputStyle}
              onFocus={(e) => (e.target.style.border = '1.5px solid #7c3aed')}
              onBlur={(e) => (e.target.style.border = '1.5px solid #e8e4ff')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
              Email address
            </label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="sara@howl.in"
              style={inputStyle}
              onFocus={(e) => (e.target.style.border = '1.5px solid #7c3aed')}
              onBlur={(e) => (e.target.style.border = '1.5px solid #e8e4ff')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
              Password
            </label>
            <input
              name="password"
              type="text"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              style={inputStyle}
              onFocus={(e) => (e.target.style.border = '1.5px solid #7c3aed')}
              onBlur={(e) => (e.target.style.border = '1.5px solid #e8e4ff')}
            />
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
              Share this directly with the team member.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={inputStyle}
              onFocus={(e) => (e.target.style.border = '1.5px solid #7c3aed')}
              onBlur={(e) => (e.target.style.border = '1.5px solid #e8e4ff')}
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 text-xs rounded-xl px-4 py-3"
              style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48' }}
            >
              ⚠ {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                border: '1.5px solid #e8e4ff',
                color: '#6b7280',
                background: '#faf9ff',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{
                background: loading
                  ? '#a78bfa'
                  : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating...' : 'Create user'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}