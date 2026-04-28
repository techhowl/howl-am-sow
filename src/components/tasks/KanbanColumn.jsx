// src/components/tasks/KanbanColumn.jsx
'use client';

import TaskCard from '@/components/tasks/TaskCard';
import { STATUS_LABELS } from '@/lib/constants/tasks';

const COLUMN_STYLE = {
  copy_wip: {
    dot:    'bg-purple-400',
    header: 'text-purple-700',
    bg:     'bg-purple-50/80',
    empty:  'border-purple-200 text-purple-300',
  },
  video_wip: {
    dot:    'bg-violet-400',
    header: 'text-violet-700',
    bg:     'bg-violet-50/80',
    empty:  'border-violet-200 text-violet-300',
  },
  design_wip: {
    dot:    'bg-blue-400',
    header: 'text-blue-700',
    bg:     'bg-blue-50/80',
    empty:  'border-blue-200 text-blue-300',
  },
  internal_review: {
    dot:    'bg-amber-400',
    header: 'text-amber-700',
    bg:     'bg-amber-50/80',
    empty:  'border-amber-200 text-amber-300',
  },
  sent_to_client: {
    dot:    'bg-cyan-400',
    header: 'text-cyan-700',
    bg:     'bg-cyan-50/80',
    empty:  'border-cyan-200 text-cyan-300',
  },
  approved: {
    dot:    'bg-green-400',
    header: 'text-green-700',
    bg:     'bg-green-50/80',
    empty:  'border-green-200 text-green-300',
  },
  rejected: {
    dot:    'bg-red-400',
    header: 'text-red-600',
    bg:     'bg-red-50/80',
    empty:  'border-red-200 text-red-300',
  },
  live: {
    dot:    'bg-emerald-500',
    header: 'text-emerald-700',
    bg:     'bg-emerald-50/80',
    empty:  'border-emerald-200 text-emerald-300',
  },
};

export default function KanbanColumn({ status, tasks, onTaskClick }) {
  const style = COLUMN_STYLE[status] || {
    dot:    'bg-gray-400',
    header: 'text-gray-700',
    bg:     'bg-gray-50',
    empty:  'border-gray-200 text-gray-400',
  };

  return (
    <div className="flex flex-col w-full">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 ${style.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
          <span className={`text-xs font-semibold ${style.header}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2.5 flex-1">
        {tasks.length === 0 ? (
          <div className={`flex items-center justify-center py-8 border-2 border-dashed rounded-xl text-xs ${style.empty}`}>
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