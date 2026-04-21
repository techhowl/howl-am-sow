// src/components/brands/CreateBrandModal.jsx

'use client'

import { useState } from 'react'

const COLORS = [
  '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
  '#d97706', '#16a34a', '#0891b2', '#0f172a',
]

export default function CreateBrandModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    color: COLORS[0],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      onCreated(data.brand)
      onClose()
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              Create brand
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              A brand acts as a workspace
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              fontSize: '16px',
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>
              Brand name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nike, Dove, Lays"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                color: '#111827',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid #4f46e5'
                e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid #e5e7eb'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Color */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Brand color
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: c,
                    border: form.color === c ? '2.5px solid #111827' : '2.5px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: form.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '700',
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              {form.name ? form.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                {form.name || 'Brand name'}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                Preview
              </div>
            </div>
          </div>

          {error && (
            <div style={{ fontSize: '12px', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '9px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#fff',
                background: loading ? '#818cf8' : '#4f46e5',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating...' : 'Create brand'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}