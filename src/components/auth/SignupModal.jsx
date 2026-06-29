'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { X, User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Portal from '@/components/shared/Portal'
import { Field } from '@/components/shared/Field'

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
    <Portal>
      <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2 className="editorial-h2 text-foreground mb-1">Create your account</h2>
              <p className="text-xs text-muted-foreground">
                Access is granted by an administrator after signup.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost p-2"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body space-y-5">
            {/* Name field */}
            <div className="space-y-2">
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Afzal Khan"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="afzal@howl.in"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input pl-10 pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-destructive/10 text-destructive border border-destructive/30 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}
          </form>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary gloss"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
