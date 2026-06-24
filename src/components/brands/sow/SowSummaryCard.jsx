'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AnimatedBar } from '@/components/shared/motion/AnimatedBar'
import { MoneyFlow, CountFlow } from './MoneyFlow'

/** Hero KPI card — scope / delivered / variance with animated values + progress. */
export function SowSummaryCard({ totals }) {
  const deliveredPct = totals.scope > 0 ? (totals.delivered / totals.scope) * 100 : 0
  const over = totals.variance > 0
  const under = totals.variance < 0
  const VIcon = over ? TrendingUp : under ? TrendingDown : Minus

  return (
    <div
      className="gloss relative mb-5 overflow-hidden rounded-[var(--radius-xl)] p-5"
      style={{
        background:
          'linear-gradient(135deg, var(--primary) 0%, color-mix(in oklab, var(--primary) 68%, var(--accent-2)) 100%)',
        color: 'var(--primary-foreground)',
        border: '1px solid color-mix(in oklab, var(--primary) 60%, white 20%)',
        boxShadow: '0 8px 32px color-mix(in oklab, var(--primary) 40%, transparent)',
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">Monthly Scope Total</p>
          <p className="font-display mt-1 text-3xl font-bold">
            <MoneyFlow value={totals.scope} />
          </p>
          <p className="mt-0.5 text-[11px] opacity-75">
            <CountFlow value={totals.units} /> deliverables scoped
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">Delivered So Far</p>
          <p className="mt-1 text-xl font-bold">
            <MoneyFlow value={totals.delivered} />
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">Variance</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xl font-bold">
            <VIcon size={16} aria-hidden="true" />
            <MoneyFlow value={totals.variance} signed />
          </p>
          <p className="mt-0.5 text-[11px] opacity-75">
            {over ? 'Overdelivered' : under ? 'Underdelivered' : 'On scope'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[10px] opacity-80">
          <span>Delivered vs scope</span>
          <span className="tabular-nums">{Math.round(deliveredPct)}%</span>
        </div>
        <AnimatedBar value={deliveredPct} color="var(--primary-foreground)" track="bg-black/15" height={6} />
      </div>
    </div>
  )
}
