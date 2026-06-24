// src/components/brands/ScopeVarianceSection.jsx
'use client'

import { TrendingUp, TrendingDown, IndianRupee } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedBar } from '@/components/shared/motion/AnimatedBar'
import { MoneyFlow } from './sow/MoneyFlow'
import { formatINR, formatUnits, varianceTextClass, varianceTint } from './sow/sowFormat'

export default function ScopeVarianceSection({ budgetSummary, sowByType }) {
  if (!budgetSummary || budgetSummary.scopeValue === 0) {
    return (
      <div className="surface-card mb-6 p-5">
        <h3 className="text-[14px] font-bold text-foreground">Scope &amp; Delivery Value</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">
          No pricing set for this month&apos;s SOW. Add unit rates in the Scope of Work tab to see value tracking.
        </p>
      </div>
    )
  }

  const { scopeValue, deliveredValue, pendingValue, variance, deliveredPercent } = budgetSummary
  const rowsWithBudget = sowByType.filter((row) => row.target !== null && row.unitRate > 0)

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-[14px] font-bold text-foreground">Scope &amp; Delivery Value</h3>
        <span className="eyebrow">· Monthly retainer reconciliation</span>
      </div>

      {/* Summary cards */}
      <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {/* Scope */}
        <div className="surface-card p-4">
          <p className="eyebrow">Scope Value</p>
          <p className="mt-1.5 text-lg font-bold text-foreground tabular-nums">
            <MoneyFlow value={scopeValue} />
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Committed this month</p>
        </div>

        {/* Delivered */}
        <div className="surface-card p-4">
          <div className="mb-1.5 flex items-center gap-1.5">
            <IndianRupee size={12} className="text-success" aria-hidden="true" />
            <p className="eyebrow !tracking-[0.12em]">Delivered Value</p>
          </div>
          <p className="text-lg font-bold text-foreground tabular-nums">
            <MoneyFlow value={deliveredValue} />
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">{deliveredPercent}% of scope</p>
          <div className="mt-2">
            <AnimatedBar value={Math.min(deliveredPercent, 100)} color="var(--success)" height={6} />
          </div>
        </div>

        {/* Pending */}
        <div className="surface-card p-4">
          <p className="eyebrow">Pending Value</p>
          <p className="mt-1.5 text-lg font-bold tabular-nums" style={{ color: 'var(--warning)' }}>
            <MoneyFlow value={pendingValue} />
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">If pending tasks complete</p>
        </div>

        {/* Variance */}
        <div
          className="surface-card p-4"
          style={{
            background: varianceTint(variance, 10) !== 'transparent' ? varianceTint(variance, 10) : undefined,
            borderColor:
              variance > 0
                ? 'color-mix(in oklab, var(--success) 30%, transparent)'
                : variance < 0
                ? 'color-mix(in oklab, var(--destructive) 30%, transparent)'
                : undefined,
          }}
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            {variance > 0 ? (
              <TrendingUp size={12} className="text-success" aria-hidden="true" />
            ) : variance < 0 ? (
              <TrendingDown size={12} className="text-destructive" aria-hidden="true" />
            ) : null}
            <p className="eyebrow">Variance</p>
          </div>
          <p className={cn('text-lg font-bold tabular-nums', varianceTextClass(variance))}>
            <MoneyFlow value={variance} signed />
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {variance > 0
              ? 'Overdelivered — adjust next month'
              : variance < 0
              ? 'Underdelivered — catch up next month'
              : 'On scope'}
          </p>
        </div>
      </div>

      {/* Per-type breakdown */}
      {rowsWithBudget.length > 0 && (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div
                className="grid items-center gap-2 border-b border-border bg-muted px-3.5 py-2.5"
                style={{ gridTemplateColumns: '2fr 70px 80px 90px 1fr 1fr 1fr' }}
              >
                {['Particulars', 'Scope', 'Delivered', 'Unit ₹', 'Scope ₹', 'Delivered ₹', 'Variance'].map((h, i) => (
                  <span
                    key={h}
                    className={cn('eyebrow', i === 0 ? 'text-left' : i < 4 ? 'text-center' : 'text-right')}
                    style={{ fontSize: 10, letterSpacing: '0.08em' }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {rowsWithBudget.map((row, idx) => (
                <div
                  key={row.type}
                  className={cn(
                    'grid items-center gap-2 px-3.5 py-2.5 text-[12px]',
                    idx < rowsWithBudget.length - 1 && 'border-b border-border'
                  )}
                  style={{ gridTemplateColumns: '2fr 70px 80px 90px 1fr 1fr 1fr' }}
                >
                  <span className="truncate font-medium text-foreground" title={row.type}>
                    {row.type}
                  </span>
                  <span className="text-center text-foreground tabular-nums">{formatUnits(row.target)}</span>
                  <span
                    className={cn(
                      'text-center tabular-nums',
                      row.achieved >= row.target ? 'font-semibold text-success' : 'text-foreground'
                    )}
                  >
                    {row.achieved}
                  </span>
                  <span className="text-center text-muted-foreground tabular-nums">{formatINR(row.unitRate)}</span>
                  <span className="text-right font-medium text-foreground tabular-nums">
                    <MoneyFlow value={row.scopeValue} />
                  </span>
                  <span className="text-right font-medium text-foreground tabular-nums">
                    <MoneyFlow value={row.deliveredValue} />
                  </span>
                  <span className="justify-self-end">
                    <span
                      className={cn(
                        'inline-flex items-center rounded px-1.5 py-0.5 font-bold tabular-nums',
                        varianceTextClass(row.variance)
                      )}
                      style={{ background: varianceTint(row.variance, 15) }}
                    >
                      <MoneyFlow value={row.variance} signed />
                    </span>
                  </span>
                </div>
              ))}

              {/* Grand total */}
              <div
                className="grid items-center gap-2 border-t-2 border-border bg-muted px-3.5 py-3 text-[13px]"
                style={{ gridTemplateColumns: '2fr 70px 80px 90px 1fr 1fr 1fr' }}
              >
                <span className="font-bold text-foreground">Grand Total</span>
                <span />
                <span />
                <span />
                <span className="text-right font-bold text-primary tabular-nums">
                  <MoneyFlow value={scopeValue} />
                </span>
                <span className="text-right font-bold text-primary tabular-nums">
                  <MoneyFlow value={deliveredValue} />
                </span>
                <span className="justify-self-end">
                  <span
                    className={cn(
                      'inline-flex items-center rounded px-2 py-1 font-bold tabular-nums',
                      varianceTextClass(variance)
                    )}
                    style={{ background: varianceTint(variance, 15) }}
                  >
                    <MoneyFlow value={variance} signed />
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
