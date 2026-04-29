// src/app/(dashboard)/brands/[brandId]/analytics/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  format, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek,
} from 'date-fns';
import {
  BarChart2, ChevronLeft, ChevronRight, Download,
  CheckCircle2, Clock, RotateCcw, ArrowLeft, Target,
} from 'lucide-react';

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
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── SOW Progress Bar (Notion/ClickUp style) ────────────────────────────────
function SOWProgressBar({ achieved, total, percent, size = 'lg' }) {
  const isComplete = percent === 100;
  const barH = size === 'lg' ? 'h-4' : 'h-2.5';

  return (
    <div className="space-y-2">
      <div className={`w-full ${barH} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isComplete
              ? 'bg-emerald-500'
              : percent >= 70
              ? 'bg-indigo-500'
              : percent >= 40
              ? 'bg-amber-400'
              : 'bg-red-400'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          <span className="font-semibold text-gray-900">{achieved}</span> of{' '}
          <span className="font-semibold text-gray-900">{total}</span> tasks achieved
        </span>
        <span className={`text-sm font-bold ${
          isComplete ? 'text-emerald-600' : percent >= 70 ? 'text-indigo-600' : percent >= 40 ? 'text-amber-600' : 'text-red-500'
        }`}>
          {percent}%
        </span>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  copy_wip:        'bg-purple-400',
  video_wip:       'bg-violet-400',
  design_wip:      'bg-blue-400',
  internal_review: 'bg-amber-400',
  sent_to_client:  'bg-cyan-400',
  approved:        'bg-green-400',
  rejected:        'bg-red-400',
  live:            'bg-emerald-500',
};

const STATUS_LABELS = {
  copy_wip:        'Copy WIP',
  video_wip:       'Video WIP',
  design_wip:      'Design WIP',
  internal_review: 'Internal Review',
  sent_to_client:  'Sent to Client',
  approved:        'Approved',
  rejected:        'Rejected',
  live:            'Live',
};

const PRIORITY_CONFIG = {
  high:   { label: 'High',   dot: 'bg-red-500',   text: 'text-red-600',   bar: 'bg-red-500'   },
  medium: { label: 'Medium', dot: 'bg-amber-500',  text: 'text-amber-600', bar: 'bg-amber-500' },
  low:    { label: 'Low',    dot: 'bg-gray-400',   text: 'text-gray-500',  bar: 'bg-gray-400'  },
};

export default function BrandAnalyticsPage() {
  const params   = useParams();
  const router   = useRouter();
  const brandId  = params.brandId;

  const [period, setPeriod]   = useState('month');
  const [refDate, setRefDate] = useState(new Date());
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [period, refDate, brandId]);

  async function fetchData() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/brands/${brandId}/analytics?period=${period}&date=${refDate.toISOString()}`);
      const json = await res.json();
      setData(json);
    } finally { setLoading(false); }
  }

  function prev() { setRefDate((d) => period === 'week' ? subWeeks(d, 1) : subMonths(d, 1)); }
  function next() { setRefDate((d) => period === 'week' ? addWeeks(d, 1) : addMonths(d, 1)); }

  function getPeriodLabel() {
    if (period === 'week') {
      const s = startOfWeek(refDate, { weekStartsOn: 1 });
      const e = endOfWeek(refDate,   { weekStartsOn: 1 });
      return `${format(s, 'dd MMM')} – ${format(e, 'dd MMM yyyy')}`;
    }
    return format(refDate, 'MMMM yyyy');
  }

  const sow = data?.sowProgress;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="w-4 h-4 text-gray-400" />
            <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
            {data?.brand && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-300">·</span>
                {data.brand.color && (
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.brand.color }} />
                )}
                <span className="text-sm font-medium text-gray-600">{data.brand.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {['week', 'month'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                    period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={prev} className="p-2 hover:bg-gray-50 transition-colors border-r border-gray-200">
                <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <span className="text-xs font-medium text-gray-700 px-4 min-w-[140px] text-center">
                {getPeriodLabel()}
              </span>
              <button onClick={next} className="p-2 hover:bg-gray-50 transition-colors border-l border-gray-200">
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6 max-w-5xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : !data ? null : (
          <>
            {/* ── SOW PROGRESS — PRIMARY SECTION ── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {/* SOW header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">SOW Progress</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {getPeriodLabel()} · Tasks committed vs achieved
                    </p>
                  </div>
                </div>
                {sow?.total > 0 && (
                  <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    sow.percentComplete === 100
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : sow.percentComplete >= 70
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : sow.percentComplete >= 40
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {sow.percentComplete === 100 ? '🎯 SOW Complete' : `${sow.percentComplete}% Complete`}
                  </div>
                )}
              </div>

              <div className="px-6 py-5">
                {!sow || sow.total === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No tasks created this period</p>
                    <p className="text-xs text-gray-300 mt-1">Create tasks to track SOW progress</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Main progress bar */}
                    <SOWProgressBar
                      achieved={sow.achieved}
                      total={sow.total}
                      percent={sow.percentComplete}
                      size="lg"
                    />

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        {
                          label: 'SOW Committed',
                          value: sow.total,
                          sub:   'Tasks this period',
                          color: 'bg-gray-50 border-gray-200',
                          vColor: 'text-gray-900',
                        },
                        {
                          label: 'Achieved',
                          value: sow.achieved,
                          sub:   'Approved + Live',
                          color: 'bg-emerald-50 border-emerald-200',
                          vColor: 'text-emerald-700',
                        },
                        {
                          label: 'In Progress',
                          value: sow.pending,
                          sub:   'Still in workflow',
                          color: 'bg-indigo-50 border-indigo-200',
                          vColor: 'text-indigo-700',
                        },
                        {
                          label: 'Rejected',
                          value: sow.rejected,
                          sub:   'Needs rework',
                          color: 'bg-red-50 border-red-200',
                          vColor: 'text-red-700',
                        },
                      ].map((card) => (
                        <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
                          <p className="text-xs text-gray-500 font-medium mb-1.5">{card.label}</p>
                          <p className={`text-2xl font-bold ${card.vColor}`}>{card.value}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{card.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Priority breakdown with individual progress bars */}
                    {data.prioritySOW?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                          By Priority
                        </p>
                        <div className="space-y-3">
                          {data.prioritySOW.map((p) => {
                            const cfg = PRIORITY_CONFIG[p.priority];
                            return (
                              <div key={p.priority} className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 w-20 shrink-0">
                                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
                                </div>
                                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                                    style={{ width: `${p.percentComplete}%` }}
                                  />
                                </div>
                                <div className="text-xs text-gray-500 w-28 shrink-0 text-right">
                                  <span className="font-semibold text-gray-700">{p.achieved}</span>
                                  <span className="text-gray-400">/{p.total}</span>
                                  <span className={`ml-2 font-semibold ${cfg.text}`}>{p.percentComplete}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── SOW TASK LIST ── */}
            {data.sowTaskList?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">
                    SOW Tasks
                    <span className="ml-2 text-xs font-normal text-gray-400">({data.sowTaskList.length})</span>
                  </h2>
                  <button
                    onClick={() => exportCSV(data.taskList, `${data.brand?.name}-sow-${format(refDate, 'yyyy-MM')}.csv`)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>

                <div className="divide-y divide-gray-50">
                  {/* Table header */}
                  <div className="grid grid-cols-[2fr_1fr_1fr_80px] px-6 py-2.5 bg-gray-50">
                    {['Task', 'Priority', 'Status', 'Achieved'].map((h) => (
                      <p key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
                    ))}
                  </div>

                  {data.sowTaskList.map((t) => (
                    <div
                      key={t._id}
                      className={`grid grid-cols-[2fr_1fr_1fr_80px] px-6 py-3.5 hover:bg-gray-50 transition-colors ${
                        t.achieved ? '' : t.status === 'rejected' ? 'bg-red-50/40' : ''
                      }`}
                    >
                      {/* Task name */}
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                        {t.assignees && t.assignees !== '—' && (
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{t.assignees}</p>
                        )}
                      </div>

                      {/* Priority */}
                      <div className="self-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          t.priority === 'high'   ? 'bg-red-50 text-red-600' :
                          t.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {t.priority}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="self-center">
                        <span className="text-xs text-gray-500">
                          {STATUS_LABELS[t.status] || t.status}
                        </span>
                        {t.revisionCount > 0 && (
                          <span className="ml-1.5 text-[10px] text-amber-500 font-medium">
                            ↺ {t.revisionCount}
                          </span>
                        )}
                      </div>

                      {/* Achieved tick or pending */}
                      <div className="self-center">
                        {t.achieved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Done
                          </span>
                        ) : t.status === 'rejected' ? (
                          <span className="text-xs font-medium text-red-400">Rejected</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STATUS BREAKDOWN ── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Pipeline Breakdown</h2>
              {data.stats.total === 0 ? (
                <p className="text-sm text-gray-400">No data for this period</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                    {Object.entries(data.statusBreakdown).map(([status, count]) => {
                      if (!count) return null;
                      return (
                        <div
                          key={status}
                          className={`${STATUS_COLORS[status]} rounded-sm`}
                          style={{ width: `${(count / data.stats.total) * 100}%` }}
                          title={`${STATUS_LABELS[status]}: ${count}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {Object.entries(data.statusBreakdown).map(([status, count]) => {
                      if (!count) return null;
                      return (
                        <div key={status} className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
                          <span className="text-xs text-gray-500">
                            {STATUS_LABELS[status]}{' '}
                            <span className="font-semibold text-gray-700">{count}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── TEAM PERFORMANCE ── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Team Performance</h2>
                <button
                  onClick={() => exportCSV(
                    data.userStats.map((u) => ({
                      Name: u.name, Email: u.email, Role: u.role,
                      Assigned: u.assigned, Completed: u.completed, Revisions: u.totalRevisions,
                    })),
                    `${data.brand?.name}-team-${format(refDate, 'yyyy-MM')}.csv`
                  )}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              {data.userStats.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-400">No team data for this period</p>
              ) : (
                <>
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] px-6 py-2.5 bg-gray-50 border-b border-gray-100">
                    {['Member', 'Role', 'Assigned', 'Achieved', 'Progress'].map((h) => (
                      <p key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
                    ))}
                  </div>
                  {data.userStats.map((u) => {
                    const pct = u.assigned > 0 ? Math.round((u.completed / u.assigned) * 100) : 0;
                    return (
                      <div key={u._id} className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] px-6 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-indigo-700">{u.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                            {u.totalRevisions > 0 && (
                              <p className="text-[10px] text-amber-500">↺ {u.totalRevisions} revision{u.totalRevisions !== 1 ? 's' : ''}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 capitalize self-center">{u.role?.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-gray-700 self-center">{u.assigned}</span>
                        <span className="text-sm font-semibold text-emerald-600 self-center">{u.completed}</span>
                        <div className="self-center">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-500 w-7 text-right">{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}