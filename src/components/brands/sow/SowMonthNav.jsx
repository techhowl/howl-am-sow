'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Glass segmented prev / month-label / next control. */
export function SowMonthNav({ monthLabel, onPrev, onNext }) {
  return (
    <div className="glass-thin inline-flex items-center overflow-hidden rounded-[var(--radius-md)]">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous month"
        className="flex cursor-pointer items-center px-2.5 py-2 text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[140px] px-3 py-2 text-center text-[13px] font-semibold text-foreground">
        {monthLabel}
      </span>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next month"
        className="flex cursor-pointer items-center px-2.5 py-2 text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
