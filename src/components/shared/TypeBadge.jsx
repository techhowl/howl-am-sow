const TYPE_STYLES = {
  video: { label: 'Video', bg: 'bg-[var(--color-chart-5)]/10', text: 'text-[var(--color-chart-5)]' },
  video_adapt: { label: 'Video Adapt', bg: 'bg-[var(--color-chart-5)]/10', text: 'text-[var(--color-chart-5)]' },
  static: { label: 'Static', bg: 'bg-[var(--color-chart-2)]/10', text: 'text-[var(--color-chart-2)]' },
  static_adapt: { label: 'Static Adapt', bg: 'bg-[var(--color-chart-2)]/10', text: 'text-[var(--color-chart-2)]' },
  carousel: { label: 'Carousel', bg: 'bg-[var(--color-chart-4)]/10', text: 'text-[var(--color-chart-4)]' },
  gif: { label: 'GIF', bg: 'bg-[var(--color-chart-3)]/10', text: 'text-[var(--color-chart-3)]' },
  performance_asset: { label: 'Performance', bg: 'bg-[var(--color-chart-1)]/10', text: 'text-[var(--color-chart-1)]' },
  custom: { label: 'Custom', bg: 'bg-muted', text: 'text-muted-foreground' },
}

export default function TypeBadge({ type, customTypeName }) {
  const s = TYPE_STYLES[type] || TYPE_STYLES.custom
  const label = type === 'custom' && customTypeName ? customTypeName : s.label

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${s.bg} ${s.text}`}>
      {label}
    </span>
  )
}