// src/components/shared/DeadlineBadge.jsx
'use client';

import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { CalendarDays } from 'lucide-react';

export default function DeadlineBadge({ date, label, closed = false }) {
  if (!date) return null;

  const d = new Date(date);
  const overdue = !closed && isPast(d) && !isToday(d);
  const dueToday = !closed && isToday(d);
  const daysLeft = differenceInDays(d, new Date());

  let className = 'bg-gray-100 text-gray-600 border border-gray-200';
  if (closed) className = 'bg-gray-100 text-gray-400 border border-gray-200';
  else if (overdue) className = 'bg-red-50 text-red-700 border border-red-200';
  else if (dueToday) className = 'bg-amber-50 text-amber-700 border border-amber-200';
  else if (daysLeft <= 2) className = 'bg-orange-50 text-orange-700 border border-orange-200';

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${className}`}>
      <CalendarDays className="w-3 h-3" />
      {label && <span className="text-[10px] opacity-70 uppercase tracking-wide">{label}</span>}
      {format(d, 'dd MMM')}
      {overdue && <span className="font-semibold">· Overdue</span>}
      {dueToday && <span className="font-semibold">· Today</span>}
    </span>
  );
}