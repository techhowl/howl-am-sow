// src/components/tasks/KanbanColumn.jsx
'use client';

import TaskCard from '@/components/tasks/TaskCard';
import { STATUS_LABELS } from '@/lib/constants/tasks';

const COLUMN_STYLE = {
  copy_wip: { dot: 'bg-purple-400', header: 'text-purple-700', bg: 'bg-purple-50/60' },
  design_wip: { dot: 'bg-blue-400', header: 'text-blue-700', bg: 'bg-blue-50/60' },
  internal_review: { dot: 'bg-amber-400', header: 'text-amber-700', bg: 'bg-amber-50/60' },
  sent_to_client: { dot: 'bg-cyan-400', header: 'text-cyan-700', bg: 'bg-cyan-50/60' },
  approved: { dot: 'bg-green-400', header: 'text-green-700', bg: 'bg-green-50/60' },
  live: { dot: 'bg-emerald-500', header: 'text-emerald-700', bg: 'bg-emerald-50/60' },
};

export default function KanbanColumn({ status, tasks, onTaskClick }) {
  const style = COLUMN_STYLE[status] || { dot: 'bg-gray-400', header: 'text-gray-700', bg: 'bg-gray-50' };

  return (
    <div className="flex flex-col w-full">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 ${style.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className={`text-sm font-semibold ${style.header}`}>
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
          <div className="flex items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={onTaskClick} />
          ))
        )}
      </div>
    </div>
  );
}