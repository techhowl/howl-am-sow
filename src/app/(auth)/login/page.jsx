'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
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
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-6">
      {/* Composed brand wash. Replaces the old randomly-placed blurred blobs,
          which sat frozen (their animation never compiled) and read as smudges. */}
      <div aria-hidden="true" className="login-aura pointer-events-none absolute inset-0" />

      <div className="relative z-10 w-full max-w-[400px]">

        {/* Masthead */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo variant="full" size={38} />
          <div className="space-y-1.5">
            <p className="eyebrow">SOW TRACKER</p>
            <h1 className="editorial-h1 text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="surface-card glass-thick gloss p-7 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            <Field
              label="Email"
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@howl.in"
              aria-invalid={error ? 'true' : undefined}
            />

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
                className="[&_.input]:pr-11"
                aria-invalid={error ? 'true' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-1.5 bottom-1 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-muted cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              </button>
            </div>

            {/* Error — announced to screen readers, reserves no space when empty */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle size={15} className="mt-px shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>

          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => setShowSignup(true)}
            className="font-medium text-primary hover:underline cursor-pointer"
          >
            Create one
          </button>
        </p>
      </div>

      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
    </div>
  )
}
