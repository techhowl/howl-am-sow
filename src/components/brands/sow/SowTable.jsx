'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MoneyFlow, CountFlow } from './MoneyFlow'
import { varianceTextClass, varianceTint, formatINR, formatUnits } from './sowFormat'

const COLS = '1.4fr 76px 78px 96px 1fr 1fr 1fr'
const COLS_MANAGE = '1.4fr 76px 78px 96px 1fr 1fr 1fr 40px'
const EASE = [0.16, 1, 0.3, 1]
const HEADERS = ['Particulars', 'Scope', 'Delivered', 'Unit ₹', 'Scope ₹', 'Delivered ₹', 'Variance']

/** Editable SOW grid: staggered entrance, animated row add/remove, animated money. */
export function SowTable({ rows, totals, canManage, onUpdateTarget, onUpdateRate, onRemove }) {
  const reduce = useReducedMotion()
  const grid = canManage ? COLS_MANAGE : COLS

  return (
    <div className="surface-card mb-4 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header */}
          <div
            className="grid items-center gap-2 border-b border-border bg-muted px-3 py-2.5"
            style={{ gridTemplateColumns: grid }}
          >
            {HEADERS.map((h, i) => (
              <span
                key={h}
                className={cn('eyebrow', i === 0 ? 'text-left' : i < 4 ? 'text-center' : 'text-right')}
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                {h}
              </span>
            ))}
            {canManage && <span />}
          </div>

          {/* Rows */}
          <motion.div
            initial={reduce ? false : 'hidden'}
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.04 } } }}
          >
            <AnimatePresence initial={false}>
              {rows.map((row) => (
                <motion.div
                  key={row.type}
                  layout
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="grid items-center gap-2 overflow-hidden border-b border-border bg-card px-3 py-2.5 last:border-b-0"
                  style={{ gridTemplateColumns: grid }}
                >
                  {/* Type */}
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-medium text-foreground" title={row.type}>
                      {row.type}
                    </span>
                    {row.isCustom && (
                      <span
                        className="badge flex-shrink-0"
                        style={{
                          fontSize: 8,
                          background: 'color-mix(in oklab, var(--primary) 14%, transparent)',
                          color: 'var(--primary)',
                          borderColor: 'color-mix(in oklab, var(--primary) 30%, transparent)',
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>

                  {/* Scope (target) */}
                  {canManage ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={row.target}
                      aria-label={`${row.type} scope units`}
                      onChange={(e) => onUpdateTarget(row.type, e.target.value)}
                      className="input !px-1.5 !py-1.5 text-center text-[12px] font-semibold tabular-nums"
                    />
                  ) : (
                    <span className="text-center text-[13px] font-semibold text-foreground tabular-nums">
                      {formatUnits(row.target)}
                    </span>
                  )}

                  {/* Delivered (read-only) */}
                  <span
                    className={cn(
                      'text-center text-[13px] font-semibold tabular-nums',
                      row.achieved >= row.target ? 'text-success' : 'text-foreground'
                    )}
                  >
                    {formatUnits(row.achieved)}
                  </span>

                  {/* Unit rate */}
                  {canManage ? (
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={row.unitRate || 0}
                        aria-label={`${row.type} unit rate`}
                        onChange={(e) => onUpdateRate(row.type, e.target.value)}
                        className="input !pl-5 !pr-1.5 !py-1.5 text-center text-[12px] tabular-nums"
                      />
                    </div>
                  ) : (
                    <span className="text-center text-[12px] text-muted-foreground tabular-nums">
                      {formatINR(row.unitRate)}
                    </span>
                  )}

                  {/* Scope ₹ */}
                  <span
                    className={cn(
                      'text-right text-[12px] font-semibold tabular-nums',
                      row.scopeValue > 0 ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <MoneyFlow value={row.scopeValue} />
                  </span>

                  {/* Delivered ₹ */}
                  <span
                    className={cn(
                      'text-right text-[12px] font-semibold tabular-nums',
                      row.deliveredValue > 0 ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <MoneyFlow value={row.deliveredValue} />
                  </span>

                  {/* Variance */}
                  <span className="justify-self-end">
                    <span
                      className={cn(
                        'inline-flex items-center rounded px-1.5 py-0.5 text-[12px] font-bold tabular-nums',
                        varianceTextClass(row.variance)
                      )}
                      style={{ background: varianceTint(row.variance) }}
                    >
                      <MoneyFlow value={row.variance} signed />
                    </span>
                  </span>

                  {canManage && (
                    <button
                      onClick={() => onRemove(row.type)}
                      aria-label={`Remove ${row.type}`}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Totals */}
          <div
            className="grid items-center gap-2 border-t-2 border-border bg-muted px-3 py-3"
            style={{ gridTemplateColumns: grid }}
          >
            <span className="text-[12px] font-bold text-foreground">Grand Total</span>
            <span className="text-center text-[12px] font-bold text-foreground tabular-nums">
              <CountFlow value={totals.units} />
            </span>
            <span className="text-center text-[12px] font-bold text-muted-foreground">—</span>
            <span />
            <span className="text-right text-[13px] font-bold text-primary tabular-nums">
              <MoneyFlow value={totals.scope} />
            </span>
            <span className="text-right text-[13px] font-bold text-primary tabular-nums">
              <MoneyFlow value={totals.delivered} />
            </span>
            <span className="justify-self-end">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded px-1.5 py-1 text-[13px] font-bold tabular-nums',
                  varianceTextClass(totals.variance)
                )}
                style={{ background: varianceTint(totals.variance, 16) }}
              >
                {totals.variance > 0 ? (
                  <TrendingUp size={12} aria-hidden="true" />
                ) : totals.variance < 0 ? (
                  <TrendingDown size={12} aria-hidden="true" />
                ) : null}
                <MoneyFlow value={totals.variance} signed />
              </span>
            </span>
            {canManage && <span />}
          </div>
        </div>
      </div>
    </div>
  )
}
