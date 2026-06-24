import { cn } from '@/lib/utils'

/**
 * Editorial page header — eyebrow kicker + italic-serif title + lede + actions slot.
 * Replaces every ad-hoc `text-xl font-display` header. Server-safe.
 */
export function PageHeader({ eyebrow, title, lede, actions, className }) {
  return (
    <div className={cn('mb-8 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="editorial-h1 text-foreground">{title}</h1>
        {lede ? <p className="editorial-lede mt-2">{lede}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  )
}
