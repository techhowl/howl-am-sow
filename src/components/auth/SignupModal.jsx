'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  fontSize: '14px',
  color: 'var(--foreground)',
  background: 'var(--input)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  outline: 'none',
}
const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: 'var(--foreground)',
  marginBottom: '6px',
}
function focusOn(e) {
  e.target.style.border = '1px solid var(--ring)'
  e.target.style.boxShadow = '0 0 0 3px color-mix(in oklab, var(--ring) 25%, transparent)'
}
function focusOff(e) {
  e.target.style.border = '1px solid var(--border)'
  e.target.style.boxShadow = 'none'
}

export default function SignupModal({ onClose }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Could not create your account.')
        return
      }

      // Auto sign-in; the dashboard gate routes role 'user' to /pending.
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Account created. Please sign in.')
        return
      }
      router.push('/pending')
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17,24,39,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '20px', color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
              Create your account
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
              Access is granted by an administrator after signup.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--muted-foreground)', cursor: 'pointer', lineHeight: 1 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Afzal Khan"
              style={inputStyle}
              onFocus={focusOn}
              onBlur={focusOff}
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="afzal@howl.in"
              style={inputStyle}
              onFocus={focusOn}
              onBlur={focusOff}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                style={{ ...inputStyle, padding: '9px 44px 9px 12px' }}
                onFocus={focusOn}
                onBlur={focusOff}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--destructive)',
                background: 'color-mix(in oklab, var(--destructive) 10%, var(--card))',
                border: '1px solid color-mix(in oklab, var(--destructive) 30%, transparent)',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--primary-foreground)',
              background: 'var(--primary)',
              opacity: loading ? 0.6 : 1,
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = 'color-mix(in oklab, var(--primary) 90%, black)' }}
            onMouseLeave={(e) => { if (!loading) e.target.style.background = 'var(--primary)' }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
