// src/components/shared/PriorityBadge.jsx
'use client';

const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    className: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-500',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
    dot: 'bg-gray-400',
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