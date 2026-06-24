'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AlertTriangle, Check } from 'lucide-react'
import { formatINR, formatUnits } from './sowFormat'

const EASE = [0.16, 1, 0.3, 1]

/** Suggested carry-overs (accept/ignore, animated) + applied carry-overs summary. */
export function SowCarryOverPanel({
  suggested = [],
  confirmed = [],
  netImpact = 0,
  canManage,
  onAccept,
  onAcceptAll,
  onIgnore,
}) {
  const reduce = useReducedMotion()
  const showSuggested = canManage && suggested.length > 0
  const applied = confirmed.filter((c) => c.confirmedByAM)

  if (!showSuggested && applied.length === 0) return null

  return (
    <>
      {showSuggested && (
        <div
          className="mb-5 overflow-hidden rounded-[var(--radius-xl)] border"
          style={{
            borderColor: 'color-mix(in oklab, var(--warning) 35%, transparent)',
            background: 'color-mix(in oklab, var(--warning) 9%, transparent)',
          }}
        >
          <div
            className="flex items-center justify-between gap-3 border-b px-4 py-3"
            style={{ borderColor: 'color-mix(in oklab, var(--warning) 25%, transparent)' }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: 'color-mix(in oklab, var(--warning) 18%, transparent)', color: 'var(--warning)' }}
              >
                <AlertTriangle size={14} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--warning)' }}>
                  Carry-over suggestions from last month
                </p>
                <p className="text-[11px]" style={{ color: 'var(--warning)' }}>
                  Net impact:{' '}
                  <strong>
                    {netImpact > 0 ? '+' : ''}
                    {formatINR(netImpact)}
                  </strong>{' '}
                  to this month&apos;s scope
                </p>
              </div>
            </div>
            <button
              onClick={onAcceptAll}
              className="btn-primary flex-shrink-0 !px-3 !py-1.5 text-xs"
              style={{ background: 'var(--warning)', borderColor: 'var(--warning)', color: 'var(--warning-foreground)' }}
            >
              Accept all
            </button>
          </div>

          <AnimatePresence initial={false}>
            {suggested.map((co) => (
              <motion.div
                key={co.type}
                layout
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="flex items-center justify-between gap-3 overflow-hidden border-b px-4 py-2.5"
                style={{ borderColor: 'color-mix(in oklab, var(--warning) 18%, transparent)' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">
                    {co.type}
                    <span
                      className="ml-2 text-[11px] font-medium tabular-nums"
                      style={{ color: co.amount > 0 ? 'var(--success)' : 'var(--destructive)' }}
                    >
                      {co.amount > 0 ? '+' : ''}
                      {formatUnits(co.amount)} units · {co.moneyImpact > 0 ? '+' : ''}
                      {formatINR(co.moneyImpact)}
                    </span>
                  </p>
                  {co.note && (
                    <p className="mt-0.5 text-[11px]" style={{ color: 'var(--warning)' }}>
                      {co.note}
                    </p>
                  )}
                </div>
                <div className="flex flex-shrink-0 gap-1.5">
                  <button data-tone="primary" onClick={() => onAccept(co)} className="chip cursor-pointer">
                    Accept
                  </button>
                  <button onClick={() => onIgnore(co.type)} className="chip cursor-pointer hover:text-foreground">
                    Ignore
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {applied.length > 0 && (
        <div
          className="mb-4 rounded-[var(--radius-lg)] border px-4 py-3"
          style={{
            borderColor: 'color-mix(in oklab, var(--success) 30%, transparent)',
            background: 'color-mix(in oklab, var(--success) 9%, transparent)',
          }}
        >
          <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5" style={{ color: 'var(--success)' }}>
            <Check size={12} aria-hidden="true" />
            Applied carry-overs
          </p>
          {applied.map((co) => (
            <p key={co.type} className="text-[12px] tabular-nums" style={{ color: 'var(--success)' }}>
              • {co.type}: {co.amount > 0 ? '+' : ''}
              {formatUnits(co.amount)} units ({co.moneyImpact > 0 ? '+' : ''}
              {formatINR(co.moneyImpact || 0)}) from {co.fromMonth}
            </p>
          ))}
        </div>
      )}
    </>
  )
}
