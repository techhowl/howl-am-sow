const TYPE_STYLES = {
  video: { label: 'Video', bg: 'bg-purple-50', text: 'text-purple-700' },
  video_adapt: { label: 'Video Adapt', bg: 'bg-purple-50', text: 'text-purple-700' },
  static: { label: 'Static', bg: 'bg-blue-50', text: 'text-blue-700' },
  static_adapt: { label: 'Static Adapt', bg: 'bg-blue-50', text: 'text-blue-700' },
  carousel: { label: 'Carousel', bg: 'bg-pink-50', text: 'text-pink-700' },
  gif: { label: 'GIF', bg: 'bg-amber-50', text: 'text-amber-700' },
  performance_asset: { label: 'Performance', bg: 'bg-green-50', text: 'text-green-700' },
  custom: { label: 'Custom', bg: 'bg-gray-100', text: 'text-gray-600' },
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