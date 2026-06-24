'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

/**
 * Theme toggle with a cinematic expanding-circle swap (View Transitions API).
 * The new theme is revealed as a clip-path circle growing from the click point.
 * Falls back to an instant swap where View Transitions are unsupported.
 */
export function ThemeToggle({ className = '' }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  function toggle(e) {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement

    // origin of the expanding circle = the button center
    const rect = e.currentTarget.getBoundingClientRect()
    root.style.setProperty('--theme-toggle-x', `${rect.left + rect.width / 2}px`)
    root.style.setProperty('--theme-toggle-y', `${rect.top + rect.height / 2}px`)

    if (!document.startViewTransition) {
      setTheme(next)
      return
    }
    document.startViewTransition(() => setTheme(next))
  }

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${className}`}
    >
      {/* render a stable icon until mounted to avoid hydration mismatch */}
      {!mounted ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  )
}
