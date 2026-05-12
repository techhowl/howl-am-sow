// src/components/tasks/TaskCard.jsx
'use client';

import { RotateCcw } from 'lucide-react';
import PriorityBadge from '@/components/shared/PriorityBadge';
import DeadlineBadge from '@/components/shared/DeadlineBadge';

// Colour-code task types so team can instantly identify content type
const TYPE_COLORS = {
  'Static':           { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Static Adapt':     { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Video':            { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
  'Video Adapt':      { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
  'Reel':             { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  'Carousel':         { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  'GIF':              { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'Story':            { bg: '#fdf4ff', color: '#a21caf', border: '#f0abfc' },
  'Performance Asset':{ bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  'Other':            { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
};

function TypeBadge({ type }) {
  if (!type) return null;
  const style = TYPE_COLORS[type] || TYPE_COLORS['Other'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
      background: style.bg, color: style.color, border: `1px solid ${style.border}`,
      whiteSpace: 'nowrap',
    }}>
      {type}
    </span>
  );
}

export default function TaskCard({ task, onClick }) {
  const isLive = task.status === 'live';

  return (
    <div
      onClick={() => onClick(task)}
      className="bg-white border border-gray-200 rounded-xl p-3.5 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all group"
    >
      {/* Top row — priority + type badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <PriorityBadge priority={task.priority} size="xs" />
        <TypeBadge type={task.type} />
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 leading-snug mb-2.5 group-hover:text-indigo-700 transition-colors">
        {task.title}
      </p>

      {/* Revision count */}
      {task.revisionCount > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">
            <RotateCcw className="w-3 h-3" />
            Rev {task.revisionCount}
          </span>
        </div>
      )}

      {/* Deadlines */}
      {(task.internalDeadline || task.externalDeadline) && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {task.internalDeadline && <DeadlineBadge date={task.internalDeadline} label="Int" closed={isLive} />}
          {task.externalDeadline && <DeadlineBadge date={task.externalDeadline} label="Ext" closed={isLive} />}
        </div>
      )}

      {/* Assignees */}
      {task.assignees?.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {task.assignees.slice(0, 4).map((user) => {
            const name     = user.name || '';
            const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <span key={user._id} title={name}
                className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center justify-center border border-white"
              >
                {initials}
              </span>
            );
          })}
          {task.assignees.length > 4 && (
            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold flex items-center justify-center border border-white">
              +{task.assignees.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}