'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Download,
  Users,
  CheckCircle2,
  Clock,
  RotateCcw,
  Zap,
} from 'lucide-react';

// ── CSV export ─────────────────────────────────────────────────────────────
function exportCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h] ?? '';
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ── Status bar ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  copy_wip: 'bg-purple-400',
  design_wip: 'bg-blue-400',
  internal_review: 'bg-amber-400',
  sent_to_client: 'bg-cyan-400',
  approved: 'bg-green-400',
  rejected: 'bg-red-400',
  live: 'bg-emerald-500',
};

const STATUS_LABELS = {
  copy_wip: 'Copy WIP',
  design_wip: 'Design WIP',
  internal_review: 'Internal Review',
  sent_to_client: 'Sent to Client',
  approved: 'Approved',
  rejected: 'Rejected',
  live: 'Live',
};

function StatusBar({ breakdown, total }) {
  if (!total) return <p className="text-sm text-gray-400">No data</p>;
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {Object.entries(breakdown).map(([status, count]) => {
          if (!count) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={status}
              className={`${STATUS_COLORS[status]} rounded-sm`}
              style={{ width: `${pct}%` }}
              title={`${STATUS_LABELS[status]}: ${count}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        {Object.entries(breakdown).map(([status, count]) => {
          if (!count) return null;
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
              <span className="text-xs text-gray-500">
                {STATUS_LABELS[status]} <span className="font-medium text-gray-700">{count}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState('month');
  const [refDate, setRefDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period, refDate]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics?period=${period}&date=${refDate.toISOString()}`
      );
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  function prev() {
    setRefDate((d) => (period === 'week' ? subWeeks(d, 1) : subMonths(d, 1)));
  }

  function next() {
    setRefDate((d) => (period === 'week' ? addWeeks(d, 1) : addMonths(d, 1)));
  }

  function getPeriodLabel() {
    if (period === 'week') {
      const s = startOfWeek(refDate, { weekStartsOn: 1 });
      const e = endOfWeek(refDate, { weekStartsOn: 1 });
      return `${format(s, 'dd MMM')} – ${format(e, 'dd MMM yyyy')}`;
    }
    return format(refDate, 'MMMM yyyy');
  }

  function handleExportBrands() {
    if (!data?.brandStats) return;
    exportCSV(
      data.brandStats.map((b) => ({
        Brand: b.name,
        Total: b.total,
        Live: b.live,
        Pending: b.pending,
        'Had Revisions': b.rejected,
        'Avg Revisions': b.avgRevisions,
      })),
      `analytics-brands-${period}-${format(refDate, 'yyyy-MM-dd')}.csv`
    );
  }

  function handleExportUsers() {
    if (!data?.userStats) return;
    exportCSV(
      data.userStats.map((u) => ({
        Name: u.name,
        Email: u.email,
        Role: u.role,
        Assigned: u.assigned,
        Completed: u.completed,
        'Total Revisions': u.totalRevisions,
      })),
      `analytics-users-${period}-${format(refDate, 'yyyy-MM-dd')}.csv`
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gray-400" />
            <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Period toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {['week', 'month'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                    period === p
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Date navigator */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
              <button
                onClick={prev}
                className="p-1.5 hover:bg-gray-50 rounded-l-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-xs font-medium text-gray-700 px-3 min-w-[140px] text-center">
                {getPeriodLabel()}
              </span>
              <button
                onClick={next}
                className="p-1.5 hover:bg-gray-50 rounded-r-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : !data ? null : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total Tasks" value={data.stats.total} icon={BarChart2} color="bg-indigo-100 text-indigo-600" />
              <StatCard label="Live" value={data.stats.live} icon={Zap} color="bg-emerald-100 text-emerald-600" />
              <StatCard label="Pending" value={data.stats.pending} icon={Clock} color="bg-amber-100 text-amber-600" />
              <StatCard label="Had Revisions" value={data.stats.rejected} icon={RotateCcw} color="bg-red-100 text-red-600" />
              <StatCard label="Avg Revisions" value={data.stats.avgRevisions} icon={RotateCcw} color="bg-purple-100 text-purple-600" />
            </div>

            {/* Status breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Status Breakdown</h2>
              <StatusBar breakdown={data.statusBreakdown} total={data.stats.total} />
            </div>

            {/* Brand breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">By Brand</h2>
                <button
                  onClick={handleExportBrands}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              {data.brandStats.length === 0 ? (
                <p className="text-sm text-gray-400">No brand data for this period</p>
              ) : (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                    {['Brand', 'Total', 'Live', 'Pending', 'Had Revisions', 'Avg Revisions'].map((h) => (
                      <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
                    ))}
                  </div>
                  {data.brandStats.map((b) => (
                    <div
                      key={b._id}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {b.color && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        )}
                        <span className="text-sm font-medium text-gray-900">{b.name}</span>
                      </div>
                      <span className="text-sm text-gray-700">{b.total}</span>
                      <span className="text-sm text-emerald-600 font-medium">{b.live}</span>
                      <span className="text-sm text-amber-600">{b.pending}</span>
                      <span className="text-sm text-red-500">{b.rejected}</span>
                      <span className="text-sm text-gray-700">{b.avgRevisions}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User performance */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Team Performance</h2>
                <button
                  onClick={handleExportUsers}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              {data.userStats.length === 0 ? (
                <p className="text-sm text-gray-400">No user data for this period</p>
              ) : (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                    {['Member', 'Role', 'Assigned', 'Completed', 'Total Revisions'].map((h) => (
                      <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
                    ))}
                  </div>
                  {data.userStats.map((u) => (
                    <div
                      key={u._id}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-semibold text-indigo-700">
                            {u.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{u.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 capitalize self-center">
                        {u.role?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-700 self-center">{u.assigned}</span>
                      <span className="text-sm text-emerald-600 font-medium self-center">{u.completed}</span>
                      <span className="text-sm text-gray-700 self-center">{u.totalRevisions}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}