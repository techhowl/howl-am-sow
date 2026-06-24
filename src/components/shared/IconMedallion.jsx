import { cn } from '@/lib/utils'

/**
 * Ringed, faintly-gradient icon/avatar container — replaces flat `bg-primary/10` boxes.
 * `tone` is a CSS custom-property name (e.g. '--primary', '--success', '--color-chart-2').
 * Server-safe (no hooks).
 */
const SIZES = {
  sm: 'h-7 w-7 rounded-lg [&>svg]:h-3.5 [&>svg]:w-3.5 text-[11px]',
  md: 'h-9 w-9 rounded-xl [&>svg]:h-4 [&>svg]:w-4 text-xs',
  lg: 'h-11 w-11 rounded-xl [&>svg]:h-5 [&>svg]:w-5 text-sm',
}

export function IconMedallion({ icon: Icon, tone = '--primary', size = 'md', className, children }) {
  return (
    <span
      className={cn('inline-flex items-center justify-center font-semibold border shrink-0', SIZES[size], className)}
      style={{
        color: `var(${tone})`,
        background: `color-mix(in oklab, var(${tone}) 12%, transparent)`,
        borderColor: `color-mix(in oklab, var(${tone}) 24%, transparent)`,
        boxShadow: `0 0 0 4px color-mix(in oklab, var(${tone}) 5%, transparent)`,
      }}
    >
      {Icon ? <Icon aria-hidden="true" /> : children}
    </span>
  )
}
