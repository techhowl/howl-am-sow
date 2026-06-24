import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconMedallion } from '@/components/shared/IconMedallion'
import { AnimatedNumber } from '@/components/shared/motion/AnimatedNumber'

/**
 * KPI card — elevated surface, ringed medallion icon, big value.
 * `tone` is a CSS var name for the icon medallion (e.g. '--primary', '--success').
 * `value` may be a node (e.g. <AnimatedNumber/>) or a primitive. Server-safe.
 */
export function StatCard({ label, value, icon, tone = '--primary', href, delta, className }) {
  const inner = (
    <div
      className={cn(
        'surface-card surface-card-hover group h-full cursor-pointer p-5',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <IconMedallion icon={icon} tone={tone} />
        {href ? (
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        ) : null}
      </div>
      <p className="mb-1 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </p>
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {delta ? <span className="text-[11px] font-medium text-success">{delta}</span> : null}
      </div>
    </div>
  )
  if (href) return <Link href={href} className="block focus-visible:outline-none">{inner}</Link>
  return inner
}
