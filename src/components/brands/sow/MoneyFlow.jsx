'use client'

import NumberFlow from '@number-flow/react'
import { cn } from '@/lib/utils'

// NumberFlow respects prefers-reduced-motion automatically (snaps instead of animating).
const INR = { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }
const INR_SIGNED = { ...INR, signDisplay: 'exceptZero' } // +₹ / −₹ for variance

/**
 * Animated INR amount with Indian digit grouping (₹1,23,456).
 * `signed` → show +/− (use for variance).
 */
export function MoneyFlow({ value = 0, signed = false, className, ...props }) {
  return (
    <NumberFlow
      value={Math.round(Number(value) || 0)}
      locales="en-IN"
      format={signed ? INR_SIGNED : INR}
      className={cn('tabular-nums', className)}
      {...props}
    />
  )
}

/** Animated unit count (integer or up-to-2-decimals). */
export function CountFlow({ value = 0, className, ...props }) {
  return (
    <NumberFlow
      value={Number(value) || 0}
      locales="en-IN"
      format={{ maximumFractionDigits: 2 }}
      className={cn('tabular-nums', className)}
      {...props}
    />
  )
}
