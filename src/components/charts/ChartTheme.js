/**
 * Token-driven Recharts theming. Colors are CSS vars, so charts re-theme instantly
 * on light/dark toggle (SVG fill/stroke resolve var() fine in all evergreen browsers).
 */
export const SERIES = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

export const SEMANTIC = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
  muted: 'var(--muted-foreground)',
}

export const AXIS = {
  stroke: 'var(--border)',
  tick: { fill: 'var(--muted-foreground)', fontSize: 11 },
}

export const GRID_STROKE = 'var(--border)'

/** Spread onto a Recharts <Tooltip> — overrides its hardcoded-white default. */
export const tooltipProps = {
  cursor: { fill: 'color-mix(in oklab, var(--foreground) 6%, transparent)' },
  contentStyle: {
    background: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    color: 'var(--popover-foreground)',
    fontSize: 12,
    padding: '8px 10px',
  },
  labelStyle: { color: 'var(--muted-foreground)', fontWeight: 500, marginBottom: 2 },
  itemStyle: { color: 'var(--popover-foreground)' },
}
