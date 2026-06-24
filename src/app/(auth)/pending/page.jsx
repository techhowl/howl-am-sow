'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Clock } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { IconMedallion } from '@/components/shared/IconMedallion'

export default function PendingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
    // Already approved → send to the app
    if (status === 'authenticated' && session?.user?.role && session.user.role !== 'user') {
      router.replace('/dashboard')
    }
  }, [status, session, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <Logo variant="full" size={34} className="mb-8" />

        <IconMedallion icon={Clock} tone="--warning" size="lg" className="mb-5" />

        <p className="eyebrow mb-2">Awaiting approval</p>
        <h1 className="editorial-h1 text-foreground mb-2">Access pending</h1>
        <p className="editorial-lede mb-1">
          Your account has been created but doesn&apos;t have access yet. Contact your
          administrator to be granted access.
        </p>

        {session?.user?.email && (
          <p className="text-sm text-muted-foreground mt-3 mb-6">
            Signed in as <span className="text-foreground font-medium">{session.user.email}</span>
          </p>
        )}

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="btn-ghost w-full justify-center mt-2"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
