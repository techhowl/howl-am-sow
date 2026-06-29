// src/components/users/CreateUserModal.jsx

'use client'

import { useState } from 'react'
import { getCreatableRoles } from '@/lib/auth/permissions'

const ROLE_LABELS = {
  admin: 'Admin',
  account_manager: 'Account Manager',
  management_trainee_am: 'Management Trainee AM',
  executive_am: 'Executive AM',
  senior_am: 'Senior AM',
  lead_am: 'Lead AM',
  designer: 'Designer',
  copywriter: 'Copywriter',
  motion_designer: 'Motion Designer',
}

export default function CreateUserModal({ onClose, onCreated, creatorRole }) {
  const availableRoles = getCreatableRoles(creatorRole).map((value) => ({
    value,
    label: ROLE_LABELS[value] || value,
  }))

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: availableRoles[0]?.value || '',
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
    border: '1.5px solid var(--border)',
    fontSize: '14px',
    color: 'var(--foreground)',
    background: 'var(--input)',
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
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'color-mix(in oklch, var(--primary) 10%, transparent)' }}
            >
              👤
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                Create new user
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Share credentials with the team member
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all"
            style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
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
              onFocus={(e) => (e.target.style.border = '1.5px solid var(--ring)')}
              onBlur={(e) => (e.target.style.border = '1.5px solid var(--border)')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
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
              onFocus={(e) => (e.target.style.border = '1.5px solid var(--ring)')}
              onBlur={(e) => (e.target.style.border = '1.5px solid var(--border)')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
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
              onFocus={(e) => (e.target.style.border = '1.5px solid var(--ring)')}
              onBlur={(e) => (e.target.style.border = '1.5px solid var(--border)')}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Share this directly with the team member.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={inputStyle}
              onFocus={(e) => (e.target.style.border = '1.5px solid var(--ring)')}
              onBlur={(e) => (e.target.style.border = '1.5px solid var(--border)')}
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
              style={{ background: 'color-mix(in oklch, var(--destructive) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--destructive) 30%, transparent)', color: 'var(--destructive)' }}
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
                border: '1.5px solid var(--border)',
                color: 'var(--muted-foreground)',
                background: 'var(--muted)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                color: 'var(--primary-foreground)',
                background: 'var(--primary)',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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