// src/app/(dashboard)/timeline/page.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, isToday, differenceInCalendarDays } from 'date-fns';
import { Calendar, AlertCircle, Clock, ChevronDown, Filter, LayoutList } from 'lucide-react';
import { isOverdue, isDeadlineWithinBusinessDays, businessDaysBetween } from '@/lib/business-days';

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
  copy_wip:        'bg-purple-100 text-purple-700',
  video_wip:       'bg-violet-100 text-violet-700',
  design_wip:      'bg-blue-100 text-blue-700',
  internal_review: 'bg-amber-100 text-amber-700',
  sent_to_client:  'bg-cyan-100 text-cyan-700',
  approved:        'bg-green-100 text-green-700',
  rejected:        'bg-red-100 text-red-700',
};

const PRIORITY_STYLES = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-gray-100 text-gray-500',
};

function DeadlineCell({ date }) {
  if (!date) return <span className="text-gray-300 text-sm">—</span>;

  const d     = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue   = isOverdue(d) && !isToday(d);
  const dueToday  = isToday(d);
  const within3bd = !overdue && !dueToday && isDeadlineWithinBusinessDays(d, 3);
  const daysLeft  = differenceInCalendarDays(d, today);
  const bdLeft    = overdue ? null : businessDaysBetween(today, d);

  if (overdue) {
    return (
      <div className="flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-600">{format(d, 'dd MMM yyyy')}</p>
          <p className="text-xs text-red-400">{Math.abs(daysLeft)}d overdue</p>
        </div>
      </div>
    );
  }

  if (dueToday) {
    return (
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-orange-600">Today</p>
          <p className="text-xs text-orange-400">Due today</p>
        </div>
      </div>
    );
  }

  if (within3bd) {
    return (
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-700">{format(d, 'dd MMM yyyy')}</p>
          <p className="text-xs text-amber-500">{bdLeft} biz day{bdLeft !== 1 ? 's' : ''} left</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-700">{format(d, 'dd MMM yyyy')}</p>
      <p className="text-xs text-gray-400">{daysLeft}d left</p>
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

function getRowBg(urgency) {
  if (urgency === 0) return 'bg-red-50 hover:bg-red-100/60';
  if (urgency === 1) return 'bg-orange-50 hover:bg-orange-100/60';
  if (urgency === 2) return 'bg-amber-50/60 hover:bg-amber-100/60';
  return 'bg-white hover:bg-gray-50';
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
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">

      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h1 className="text-lg font-semibold text-gray-900">Timeline</h1>
            </div>
            <p className="text-sm text-gray-400 ml-6">
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
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
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
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
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
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3 h-3" />
                {soonCount} due soon
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </div>

          {/* Brand */}
          <div className="relative">
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-indigo-400 bg-white text-gray-700 appearance-none"
            >
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-indigo-400 bg-white text-gray-700 appearance-none"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Priority */}
          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-indigo-400 bg-white text-gray-700 appearance-none"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {anyFilter && (
            <button
              onClick={() => { setFilterBrand('all'); setFilterStatus('all'); setFilterPriority('all'); setFilterUrgency('all'); }}
              className="text-xs text-indigo-500 hover:text-indigo-700 underline transition-colors"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <LayoutList className="w-10 h-10 mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No tasks found</p>
            <p className="text-xs mt-1 text-gray-400">Create tasks in a brand to see them here</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <LayoutList className="w-10 h-10 mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No tasks match your filters</p>
            <p className="text-xs mt-1">Try adjusting the filters above</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            {/* Header row */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] bg-gray-50 border-b border-gray-200 px-4 py-3">
              {['Task', 'Brand', 'Status', 'Priority', 'Internal Deadline', 'External Deadline'].map((h) => (
                <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
              ))}
            </div>

            {/* Data rows */}
            {filtered.map((task) => {
              const urgency = getRowUrgency(task);
              const brand   = task.brandId;
              return (
                <div
                  key={task._id}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3.5 border-b border-gray-100 last:border-0 transition-colors ${getRowBg(urgency)}`}
                >
                  {/* Task name + assignees */}
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    {task.assignees?.length > 0 && (
                      <div className="flex -space-x-1 mt-1.5">
                        {task.assignees.slice(0, 3).map((a) => (
                          <div
                            key={a._id}
                            title={a.name}
                            className="w-5 h-5 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center shrink-0"
                          >
                            <span className="text-[9px] font-semibold text-indigo-700">
                              {a.name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                        ))}
                        {task.assignees.length > 3 && (
                          <div className="w-5 h-5 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                            <span className="text-[9px] text-gray-500">+{task.assignees.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Brand */}
                  <div className="flex items-start gap-1.5 min-w-0">
                    {brand?.color && (
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: brand.color }} />
                    )}
                    <span className="text-sm text-gray-700 truncate">{brand?.name || '—'}</span>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status] || 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[task.status] || task.status}
                    </span>
                  </div>

                  {/* Priority */}
                  <div>
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_STYLES[task.priority] || 'bg-gray-100 text-gray-500'}`}>
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
        )}
      </div>
    </div>
  );
}