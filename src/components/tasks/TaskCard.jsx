// src/components/tasks/TaskCard.jsx
'use client';

import { RotateCcw } from 'lucide-react';
import PriorityBadge from '@/components/shared/PriorityBadge';
import DeadlineBadge from '@/components/shared/DeadlineBadge';
import { IconMedallion } from '@/components/shared/IconMedallion';

// Colour-code task types so team can instantly identify content type
const TYPE_COLORS = {
  'Static':           { bg: 'color-mix(in oklch, var(--chart-2) 12%, transparent)', color: 'var(--chart-2)', border: 'color-mix(in oklch, var(--chart-2) 35%, transparent)' },
  'Static Adapt':     { bg: 'color-mix(in oklch, var(--chart-2) 12%, transparent)', color: 'var(--chart-2)', border: 'color-mix(in oklch, var(--chart-2) 35%, transparent)' },
  'Video':            { bg: 'color-mix(in oklch, var(--chart-4) 12%, transparent)', color: 'var(--chart-4)', border: 'color-mix(in oklch, var(--chart-4) 35%, transparent)' },
  'Video Adapt':      { bg: 'color-mix(in oklch, var(--chart-4) 12%, transparent)', color: 'var(--chart-4)', border: 'color-mix(in oklch, var(--chart-4) 35%, transparent)' },
  'Reel':             { bg: 'color-mix(in oklch, var(--chart-5) 12%, transparent)', color: 'var(--chart-5)', border: 'color-mix(in oklch, var(--chart-5) 35%, transparent)' },
  'Carousel':         { bg: 'color-mix(in oklch, var(--chart-3) 12%, transparent)', color: 'var(--chart-3)', border: 'color-mix(in oklch, var(--chart-3) 35%, transparent)' },
  'GIF':              { bg: 'color-mix(in oklch, var(--chart-1) 12%, transparent)', color: 'var(--chart-1)', border: 'color-mix(in oklch, var(--chart-1) 35%, transparent)' },
  'Story':            { bg: 'color-mix(in oklch, var(--chart-5) 12%, transparent)', color: 'var(--chart-5)', border: 'color-mix(in oklch, var(--chart-5) 35%, transparent)' },
  'Performance Asset':{ bg: 'color-mix(in oklch, var(--chart-2) 12%, transparent)', color: 'var(--chart-2)', border: 'color-mix(in oklch, var(--chart-2) 35%, transparent)' },
  'Other':            { bg: 'var(--muted)', color: 'var(--muted-foreground)', border: 'var(--border)' },
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
      className="surface-card surface-card-hover p-3.5 cursor-pointer transition-all group"
    >
      {/* Top row — priority + type badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <PriorityBadge priority={task.priority} size="xs" />
        <TypeBadge type={task.type} />
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug mb-2.5 group-hover:text-primary transition-colors">
        {task.title}
      </p>

      {/* Revision count */}
      {task.revisionCount > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <span className="inline-flex items-center gap-1 text-xs text-warning bg-warning/10 border border-warning/30 px-1.5 py-0.5 rounded-full font-medium">
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
              <span key={user._id} title={name} className="inline-flex">
                <IconMedallion size="sm" tone="--primary">
                  {initials}
                </IconMedallion>
              </span>
            );
          })}
          {task.assignees.length > 4 && (
            <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold flex items-center justify-center border border-card">
              +{task.assignees.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}