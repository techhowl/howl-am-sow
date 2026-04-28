// src/components/tasks/TaskCard.jsx
'use client';

import { RotateCcw } from 'lucide-react';
import PriorityBadge from '@/components/shared/PriorityBadge';
import DeadlineBadge from '@/components/shared/DeadlineBadge';

export default function TaskCard({ task, onClick }) {
  const isLive = task.status === 'live';

  return (
    <div
      onClick={() => onClick(task)}
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all group"
    >
      {/* Top row — priority + revision count */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <PriorityBadge priority={task.priority} size="xs" />
        {task.revisionCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">
            <RotateCcw className="w-3 h-3" />
            Rev {task.revisionCount}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 leading-snug mb-2 group-hover:text-indigo-700 transition-colors">
        {task.title}
      </p>

      {/* Deadlines */}
      {(task.internalDeadline || task.externalDeadline) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.internalDeadline && (
            <DeadlineBadge date={task.internalDeadline} label="Int" closed={isLive} />
          )}
          {task.externalDeadline && (
            <DeadlineBadge date={task.externalDeadline} label="Ext" closed={isLive} />
          )}
        </div>
      )}

      {/* Assignees */}
      {task.assignees?.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {task.assignees.slice(0, 4).map((user) => {
            const name     = user.name || '';
            const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <span
                key={user._id}
                title={name}
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