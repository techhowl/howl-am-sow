// src/components/tasks/KanbanColumn.jsx
'use client';

import TaskCard from '@/components/tasks/TaskCard';
import { STATUS_LABELS } from '@/lib/constants/tasks';
import { IconMedallion } from '@/components/shared/IconMedallion';

// 2-letter status glyphs for the column header medallion
const COLUMN_ABBR = {
  copy_wip:        'CW',
  video_wip:       'VW',
  design_wip:      'DW',
  internal_review: 'IR',
  sent_to_client:  'SC',
  approved:        'AP',
  rejected:        'RJ',
  live:            'LV',
};

const COLUMN_STYLE = {
  copy_wip: {
    dot:    'bg-primary',
    header: 'text-primary',
    bg:     'bg-primary/10',
    empty:  'border-primary/40 text-primary',
    tone:   '--primary',
  },
  video_wip: {
    dot:    'bg-primary',
    header: 'text-primary',
    bg:     'bg-primary/10',
    empty:  'border-primary/40 text-primary',
    tone:   '--primary',
  },
  design_wip: {
    dot:    'bg-primary',
    header: 'text-primary',
    bg:     'bg-primary/10',
    empty:  'border-primary/40 text-primary',
    tone:   '--primary',
  },
  internal_review: {
    dot:    'bg-warning',
    header: 'text-warning',
    bg:     'bg-warning/10',
    empty:  'border-warning/30 text-warning',
    tone:   '--warning',
  },
  sent_to_client: {
    dot:    'bg-warning',
    header: 'text-warning',
    bg:     'bg-warning/10',
    empty:  'border-warning/30 text-warning',
    tone:   '--warning',
  },
  approved: {
    dot:    'bg-success',
    header: 'text-success',
    bg:     'bg-success/10',
    empty:  'border-success/30 text-success',
    tone:   '--success',
  },
  rejected: {
    dot:    'bg-destructive',
    header: 'text-destructive',
    bg:     'bg-destructive/10',
    empty:  'border-destructive/30 text-destructive',
    tone:   '--destructive',
  },
  live: {
    dot:    'bg-success',
    header: 'text-success',
    bg:     'bg-success/10',
    empty:  'border-success/30 text-success',
    tone:   '--success',
  },
};

export default function KanbanColumn({ status, tasks, onTaskClick }) {
  const style = COLUMN_STYLE[status] || {
    dot:    'bg-muted-foreground',
    header: 'text-foreground',
    bg:     'bg-muted',
    empty:  'border-border text-muted-foreground',
    tone:   '--muted-foreground',
  };
  const abbr = COLUMN_ABBR[status] || (STATUS_LABELS[status] || '').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col w-full rounded-xl border border-border bg-muted/40 p-2">
      {/* Column header */}
      <div className="flex items-center justify-between px-1 py-1.5 mb-2">
        <div className="flex items-center gap-2">
          <IconMedallion size="sm" tone={style.tone}>
            {abbr}
          </IconMedallion>
          <span className={`text-xs font-semibold ${style.header}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <span className="chip">
          {tasks.length}
        </span>
      </div>
      <div className="rule-hairline mb-3" />

      {/* Cards */}
      <div className="flex flex-col gap-2.5 flex-1">
        {tasks.length === 0 ? (
          <div className="dashed-quiet flex items-center justify-center py-8 rounded-xl text-xs text-muted-foreground">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}