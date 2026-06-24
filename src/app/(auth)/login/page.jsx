'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import SignupModal from '@/components/auth/SignupModal'
import { Logo } from '@/components/shared/Logo'
import { Field } from '@/components/shared/Field'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Masthead */}
        <div className="mb-8 space-y-4">
          <Logo variant="full" size={36} />
          <div className="space-y-1.5">
            <p className="eyebrow">SOW TRACKER</p>
            <h1 className="editorial-h1">Welcome back</h1>
            <p className="editorial-lede">Sign in to your account to continue.</p>
          </div>
        </div>

        {/* Card */}
        <div className="surface-card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            <Field
              label="Email"
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="afzal@howl.in"
            />

            {/* Password with show/hide toggle */}
            <div className="relative">
              <Field
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="[&_.input]:pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 bottom-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 text-destructive border border-destructive/30 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => setShowSignup(true)}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </button>
        </p>
      </div>

      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
    </div>
  )
}
