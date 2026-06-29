// src/app/(dashboard)/timeline/page.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, isToday, differenceInCalendarDays } from 'date-fns';
import { Calendar, AlertCircle, Clock, ChevronDown, Filter, LayoutList } from 'lucide-react';
import { motion } from 'motion/react';
import { isOverdue, isDeadlineWithinBusinessDays, businessDaysBetween } from '@/lib/business-days';
import { AnimatedGradientWrapper as AnimatedGradient } from '@/components/ui/animated-gradient-wrapper';

// HOWL brand palette for the ambient header gradient
const HEADER_GRADIENT = ['oklch(0.52 0.17 300)', 'oklch(0.60 0.12 268)', 'oklch(0.68 0.15 355)'];

const STATUS_LABELS = {
  copy_wip:        'Copy WIP',
  video_wip:       'Video WIP',
  design_wip:      'Design WIP',
  internal_review: 'Internal Review',
  sent_to_client:  'Sent to Client',
  approved:        'Approved',
  rejected:        'Rejected',
};

const STATUS_STYLES = {
  copy_wip:        'bg-[--color-chart-4]/15 text-[--color-chart-4]',
  video_wip:       'bg-[--color-chart-5]/15 text-[--color-chart-5]',
  design_wip:      'bg-[--color-chart-2]/15 text-[--color-chart-2]',
  internal_review: 'bg-warning/10 text-warning',
  sent_to_client:  'bg-[--color-chart-1]/15 text-[--color-chart-1]',
  approved:        'bg-success/10 text-success',
  rejected:        'bg-destructive/10 text-destructive',
};

const PRIORITY_STYLES = {
  high:   'bg-destructive/10 text-destructive',
  medium: 'bg-warning/10 text-warning',
  low:    'bg-muted text-muted-foreground',
};

function DeadlineCell({ date }) {
  if (!date) return <span className="text-sm text-muted-foreground/50">—</span>;

  const d     = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue   = isOverdue(d) && !isToday(d);
  const dueToday  = isToday(d);
  const within3bd = !overdue && !dueToday && isDeadlineWithinBusinessDays(d, 3);
  const daysLeft  = differenceInCalendarDays(d, today);
  const bdLeft    = overdue ? null : businessDaysBetween(today, d);

  let Icon = null, tone = 'text-foreground', sub = `${daysLeft}d left`, subTone = 'text-muted-foreground';
  if (overdue)        { Icon = AlertCircle; tone = 'text-destructive'; sub = `${Math.abs(daysLeft)}d overdue`; subTone = 'text-destructive'; }
  else if (dueToday)  { Icon = Clock;       tone = 'text-warning';     sub = 'Due today';                     subTone = 'text-warning'; }
  else if (within3bd) { Icon = Clock;       tone = 'text-warning';     sub = `${bdLeft} biz day${bdLeft !== 1 ? 's' : ''} left`; subTone = 'text-warning'; }

  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${tone}`} aria-hidden="true" />}
      <div className="min-w-0 leading-tight">
        <p className={`text-sm font-medium ${tone}`}>{dueToday ? 'Today' : format(d, 'dd MMM yyyy')}</p>
        <p className={`text-[11px] mt-0.5 ${subTone}`}>{sub}</p>
      </div>
    </div>
  );
}

function getRowUrgency(task) {
  const dates = [task.internalDeadline, task.externalDeadline]
    .filter(Boolean)
    .map((d) => new Date(d));
  if (dates.length === 0) return 4;
  const earliest = dates.sort((a, b) => a - b)[0];
  if (isOverdue(earliest) && !isToday(earliest)) return 0;
  if (isToday(earliest)) return 1;
  if (isDeadlineWithinBusinessDays(earliest, 3)) return 2;
  return 3;
}

// Urgency is shown as a quiet left accent bar — not a full-row wash — so the
// table keeps a clear hierarchy and stays smooth in dark mode.
function urgencyAccent(urgency) {
  if (urgency === 0) return 'border-l-destructive';
  if (urgency === 1 || urgency === 2) return 'border-l-warning';
  return 'border-l-transparent';
}

export default function TimelinePage() {
  const [tasks, setTasks]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filterBrand, setFilterBrand]     = useState('all');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');

  useEffect(() => { fetchTimeline(); }, []);

  async function fetchTimeline() {
    setLoading(true);
    try {
      const res  = await fetch('/api/timeline');
      const data = await res.json();
      setTasks(data.tasks || []);
    } finally {
      setLoading(false);
    }
  }

  const brands = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      const b = t.brandId;
      if (b && !map.has(b._id)) map.set(b._id, b);
    });
    return [...map.values()];
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => {
        if (filterBrand    !== 'all' && t.brandId?._id !== filterBrand)    return false;
        if (filterStatus   !== 'all' && t.status       !== filterStatus)   return false;
        if (filterPriority !== 'all' && t.priority     !== filterPriority) return false;
        if (filterUrgency  !== 'all') {
          const u = getRowUrgency(t);
          if (filterUrgency === 'overdue' && u !== 0) return false;
          if (filterUrgency === 'today'   && u !== 1) return false;
          if (filterUrgency === 'soon'    && u !== 2) return false;
        }
        return true;
      })
      .sort((a, b) => getRowUrgency(a) - getRowUrgency(b));
  }, [tasks, filterBrand, filterStatus, filterPriority, filterUrgency]);

  const overdueCount = tasks.filter((t) => getRowUrgency(t) === 0).length;
  const todayCount   = tasks.filter((t) => getRowUrgency(t) === 1).length;
  const soonCount    = tasks.filter((t) => getRowUrgency(t) === 2).length;

  const anyFilter = filterBrand !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || filterUrgency !== 'all';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* Header */}
      <div className="relative shrink-0 overflow-hidden px-6 pt-6 pb-4 border-b border-border bg-card backdrop-blur-xl">
        {/* Ambient brand gradient */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <AnimatedGradient colors={HEADER_GRADIENT} speed={0.01} blur="heavy" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent to-background/40" />

        <div className="relative z-10 flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h1 className="text-lg font-display text-foreground">Timeline</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} across all brands
            </p>
          </div>

          {/* Urgency pills */}
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <button
                onClick={() => setFilterUrgency(filterUrgency === 'overdue' ? 'all' : 'overdue')}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filterUrgency === 'overdue'
                    ? 'bg-destructive text-destructive-foreground border-destructive'
                    : 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                {overdueCount} overdue
              </button>
            )}
            {todayCount > 0 && (
              <button
                onClick={() => setFilterUrgency(filterUrgency === 'today' ? 'all' : 'today')}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filterUrgency === 'today'
                    ? 'bg-warning text-warning-foreground border-warning'
                    : 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/15'
                }`}
              >
                <Clock className="w-3 h-3" />
                {todayCount} due today
              </button>
            )}
            {soonCount > 0 && (
              <button
                onClick={() => setFilterUrgency(filterUrgency === 'soon' ? 'all' : 'soon')}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filterUrgency === 'soon'
                    ? 'bg-warning text-warning-foreground border-warning'
                    : 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/15'
                }`}
              >
                <Clock className="w-3 h-3" />
                {soonCount} due soon
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="relative z-10 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </div>

          {/* Brand */}
          <div className="relative">
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="text-xs border border-border rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-ring bg-card text-foreground appearance-none"
            >
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-border rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-ring bg-card text-foreground appearance-none"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Priority */}
          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs border border-border rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-ring bg-card text-foreground appearance-none"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {anyFilter && (
            <button
              onClick={() => { setFilterBrand('all'); setFilterStatus('all'); setFilterPriority('all'); setFilterUrgency('all'); }}
              className="text-xs text-primary hover:text-primary underline transition-colors"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full"
              />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-sm text-muted-foreground"
              >
                Loading timeline...
              </motion.p>
            </motion.div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <LayoutList className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No tasks found</p>
            <p className="text-xs mt-1 text-muted-foreground">Create tasks in a brand to see them here</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <LayoutList className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No tasks match your filters</p>
            <p className="text-xs mt-1">Try adjusting the filters above</p>
          </div>
        ) : (
          <div className="surface-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[940px]">
                {/* Header row — sticky so it stays put while rows scroll */}
                <div className="sticky top-0 z-10 grid grid-cols-[2.2fr_1fr_1fr_0.9fr_1.1fr_1.1fr] items-center glass-thin border-b border-border px-4 py-3 pl-[calc(1rem+2px)]">
                  {['Task', 'Brand', 'Status', 'Priority', 'Internal Deadline', 'External Deadline'].map((h) => (
                    <p key={h} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{h}</p>
                  ))}
                </div>

                {/* Data rows */}
                {filtered.map((task, i) => {
                  const urgency = getRowUrgency(task);
                  const brand   = task.brandId;
                  return (
                    <div
                      key={task._id}
                      className={`grid grid-cols-[2.2fr_1fr_1fr_0.9fr_1.1fr_1.1fr] items-center px-4 py-3.5 border-l-2 border-b border-border/50 last:border-b-0 transition-colors duration-200 hover:bg-muted/50 ${urgencyAccent(urgency)} ${i % 2 === 1 ? 'bg-foreground/[0.015]' : ''}`}
                    >
                      {/* Task name + assignees */}
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        {task.assignees?.length > 0 && (
                          <div className="flex -space-x-1.5 mt-1.5">
                            {task.assignees.slice(0, 3).map((a) => (
                              <div
                                key={a._id}
                                title={a.name}
                                className="w-6 h-6 rounded-full bg-primary/15 ring-2 ring-card flex items-center justify-center shrink-0"
                              >
                                <span className="text-[10px] font-semibold text-primary">
                                  {a.name?.[0]?.toUpperCase()}
                                </span>
                              </div>
                            ))}
                            {task.assignees.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-muted ring-2 ring-card flex items-center justify-center">
                                <span className="text-[10px] font-medium text-muted-foreground">+{task.assignees.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Brand */}
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-border" style={{ backgroundColor: brand?.color || 'var(--muted-foreground)' }} />
                        <span className="text-sm text-foreground truncate">{brand?.name || '—'}</span>
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[task.status] || 'bg-muted text-muted-foreground'}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
                          {STATUS_LABELS[task.status] || task.status}
                        </span>
                      </div>

                      {/* Priority */}
                      <div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${PRIORITY_STYLES[task.priority] || 'bg-muted text-muted-foreground'}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
                          {task.priority}
                        </span>
                      </div>

                      {/* Deadlines */}
                      <DeadlineCell date={task.internalDeadline} />
                      <DeadlineCell date={task.externalDeadline} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}