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

  let className = 'bg-success/10 text-success border border-success/30';
  if (closed) className = 'bg-muted text-muted-foreground border border-border';
  else if (overdue) className = 'bg-destructive/10 text-destructive border border-destructive/30';
  else if (dueToday) className = 'bg-warning/10 text-warning border border-warning/30';
  else if (daysLeft <= 2) className = 'bg-warning/10 text-warning border border-warning/30';

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