'use client'

import { cn } from '@/lib/utils'

/**
 * Themed loading primitives — token-aware shimmer (see `.skeleton` in globals.css).
 * Build loading states shaped like the real content; never a bare spinner on a page.
 */

export function Skeleton({ className, style }) {
  return <div className={cn('skeleton', className)} style={style} aria-hidden="true" />
}

/** Inline ring spinner for buttons / small async bits. */
export function Spinner({ className, size = 16 }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-border border-t-primary align-[-2px]',
        className,
      )}
      style={{ width: size, height: size }}
    />
  )
}

/** Centered branded loader for full-panel waits where a skeleton can't be shaped. */
export function LoadingPanel({ label = 'Loading', className }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}
    >
      <Spinner size={26} className="border-[2.5px]" />
      <p className="eyebrow animate-pulse">{label}</p>
    </div>
  )
}

/** N lines of text, last line shortened. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? '60%' : `${88 - i * 6}%` }}
        />
      ))}
    </div>
  )
}

/** A row of KPI/stat cards. */
export function SkeletonStatCards({ count = 4, className }) {
  return (
    <div className={cn('grid gap-4', className)} style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="editorial-rise rounded-xl border border-border bg-card p-4"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-16" />
          <Skeleton className="mt-3 h-2 w-24" />
        </div>
      ))}
    </div>
  )
}

/** A generic card with optional title + body lines. */
export function SkeletonCard({ lines = 3, className }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <Skeleton className="h-4 w-32" />
      <div className="mt-4">
        <SkeletonText lines={lines} />
      </div>
    </div>
  )
}

/** Table-ish list of rows inside a card. */
export function SkeletonTable({ rows = 6, className }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="editorial-rise flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
          style={{ animationDelay: `${i * 45}ms` }}
        >
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <Skeleton className="h-3" style={{ width: '32%' }} />
          <Skeleton className="ml-auto h-3 w-16" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/** List rows with avatar + two text lines (comments, activity, members). */
export function SkeletonList({ rows = 4, className }) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="editorial-rise flex items-start gap-3"
          style={{ animationDelay: `${i * 55}ms` }}
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-3" style={{ width: `${70 - (i % 3) * 10}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Kanban board placeholder — columns of cards. */
export function SkeletonKanban({ columns = 5, cards = 3, className }) {
  return (
    <div className={cn('flex gap-4 overflow-hidden', className)}>
      {Array.from({ length: columns }).map((_, c) => (
        <div key={c} className="flex-1 min-w-[200px] rounded-xl border border-border bg-muted/50 p-3">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: cards }).map((_, k) => (
              <div
                key={k}
                className="editorial-rise rounded-lg border border-border bg-card p-3"
                style={{ animationDelay: `${(c * cards + k) * 40}ms` }}
              >
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-2/3" />
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
