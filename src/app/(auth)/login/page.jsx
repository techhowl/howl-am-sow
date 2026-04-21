'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
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
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError('Invalid email or password.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Wordmark */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                background: '#4f46e5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '700',
                fontSize: '15px',
              }}
            >
              H
            </div>
            <span
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                letterSpacing: '-0.01em',
              }}
            >
              Howl
            </span>
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: '600',
              color: '#111827',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}
          >
            Sign in to your account
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            SOW Tracker — internal tool
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '28px',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Email */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="afzal@howl.in"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '14px',
                  color: '#111827',
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #4f46e5'
                  e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '9px 44px 9px 12px',
                    fontSize: '14px',
                    color: '#111827',
                    background: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #4f46e5'
                    e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid #d1d5db'
                    e.target.style.boxShadow = 'none'
                  }}
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
                    color: '#9ca3af',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  fontSize: '13px',
                  color: '#b91c1c',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#fff',
                background: loading ? '#818cf8' : '#4f46e5',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.background = '#4338ca'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.background = '#4f46e5'
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#9ca3af',
            marginTop: '20px',
          }}
        >
          No access? Contact your admin.
        </p>
      </div>
    </div>
  )
}