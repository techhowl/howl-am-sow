import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconMedallion } from '@/components/shared/IconMedallion'
import { AnimatedNumber } from '@/components/shared/motion/AnimatedNumber'
import { AnimatedGradient } from '@/components/ui/animated-gradient-with-svg'

/**
 * Enhanced KPI card with animated gradient background
 * Uses conditional rendering to show gradient only on important metrics
 */
export function AnimatedStatCard({ 
  label, 
  value, 
  icon, 
  tone = '--primary', 
  href, 
  delta, 
  className,
  showGradient = false,
  gradientColors = null
}) {
  // Default gradient colors based on tone
  const defaultColors = {
    '--primary': ['oklch(0.52 0.17 300)', 'oklch(0.60 0.12 268)', 'oklch(0.68 0.15 355)'],
    '--success': ['oklch(0.60 0.16 165)', 'oklch(0.74 0.16 165)', 'oklch(0.68 0.15 355)'],
    '--warning': ['oklch(0.68 0.15 45)', 'oklch(0.82 0.14 50)', 'oklch(0.68 0.16 300)'],
    '--destructive': ['oklch(0.56 0.22 20)', 'oklch(0.66 0.22 20)', 'oklch(0.68 0.15 355)'],
    '--color-chart-4': ['oklch(0.68 0.14 40)', 'oklch(0.72 0.15 40)', 'oklch(0.80 0.13 355)'],
  }
  
  const colors = gradientColors || defaultColors[tone] || defaultColors['--primary']
  
  const inner = (
    <div
      className={cn(
        'surface-card surface-card-hover group h-full cursor-pointer p-5 relative overflow-hidden',
        className,
      )}
    >
      {showGradient && (
        <>
          <AnimatedGradient colors={colors} speed={0.03} blur="medium" />
          {/* Extra glass layer for better text readability */}
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none" />
        </>
      )}
      
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <IconMedallion icon={icon} tone={tone} />
          {href ? (
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          ) : null}
        </div>
        <p className="mb-1 text-3xl font-semibold tracking-tight text-foreground tabular-nums glass-title">
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {delta ? <span className="text-[11px] font-medium text-success">{delta}</span> : null}
        </div>
      </div>
    </div>
  )
  
  if (href) return <Link href={href} className="block focus-visible:outline-none">{inner}</Link>
  return inner
}
