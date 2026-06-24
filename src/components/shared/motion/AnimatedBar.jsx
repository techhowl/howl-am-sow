'use client'

import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * Progress/score bar that fills 0→value on mount via scaleX (transform-only, GPU-cheap).
 * `value` 0–100. `color` = CSS color/var for the fill (default var(--primary)).
 * `track` = track bg class. Respects reduced-motion (snaps to value).
 */
export function AnimatedBar({ value = 0, color = 'var(--primary)', track = 'bg-muted', height = 6, radius = 999, className }) {
  const reduce = useReducedMotion()
  const pct = Math.max(0, Math.min(100, value)) / 100
  return (
    <div
      className={cn('w-full overflow-hidden', track, className)}
      style={{ height, borderRadius: radius }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        style={{ height: '100%', background: color, borderRadius: radius, transformOrigin: 'left' }}
        initial={reduce ? { scaleX: pct } : { scaleX: 0 }}
        animate={{ scaleX: pct }}
        transition={{ duration: reduce ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}
