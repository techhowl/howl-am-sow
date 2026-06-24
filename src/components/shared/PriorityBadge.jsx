// src/components/shared/PriorityBadge.jsx
'use client';

const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    className: 'bg-destructive/10 text-destructive border border-destructive/30',
    dot: 'bg-destructive',
  },
  medium: {
    label: 'Medium',
    className: 'bg-warning/10 text-warning border border-warning/30',
    dot: 'bg-warning',
  },
  low: {
    label: 'Low',
    className: 'bg-success/10 text-success border border-success/30',
    dot: 'bg-success',
  },
};

export default function PriorityBadge({ priority, size = 'sm' }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass} ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}