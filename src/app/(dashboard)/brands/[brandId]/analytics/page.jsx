// src/app/(dashboard)/brands/[brandId]/analytics/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, addMonths, subMonths } from 'date-fns';
import { BarChart2, ChevronLeft, ChevronRight, Download, ArrowLeft, Target, CheckCircle2, Clock, AlertTriangle, Settings } from 'lucide-react';
import Link from 'next/link';

function exportCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows    = data.map((row) => headers.map((h) => { const v = row[h] ?? ''; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v; }).join(','));
  const csv     = [headers.join(','), ...rows].join('\n');
  const blob    = new Blob([csv], { type: 'text/csv' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function getBarColor(percent, overDelivered) {
  if (overDelivered) return 'bg-emerald-500';
  if (percent === 100) return 'bg-emerald-500';
  if (percent >= 70)   return 'bg-indigo-500';
  if (percent >= 40)   return 'bg-amber-400';
  return 'bg-red-400';
}

function getTextColor(percent, overDelivered) {
  if (overDelivered || percent === 100) return 'text-emerald-600';
  if (percent >= 70)   return 'text-indigo-600';
  if (percent >= 40)   return 'text-amber-600';
  return 'text-red-500';
}

// ── SOW Type Row ───────────────────────────────────────────────────────────
function SOWTypeRow({ item }) {
  const hasTarget = item.target !== null;
  const pct       = item.percentComplete;
  const barColor  = getBarColor(pct, item.overDelivered);
  const textColor = getTextColor(pct, item.overDelivered);

  return (
    <div className="px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-center gap-4">
        {/* Type name */}
        <div className="w-36 shrink-0">
          <p className="text-sm font-semibold text-gray-900">{item.type}</p>
          {!hasTarget && (
            <p className="text-[10px] text-gray-400 mt-0.5">No SOW target</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex-1">
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Numbers */}
        <div className="w-32 shrink-0 text-right">
          {hasTarget ? (
            <div>
              <span className={`text-sm font-bold ${textColor}`}>{item.achieved}</span>
              <span className="text-sm text-gray-400"> / {item.target}</span>
              <span className={`ml-2 text-xs font-semibold ${textColor}`}>{pct}%</span>
            </div>
          ) : (
            <div>
              <span className="text-sm font-bold text-gray-700">{item.achieved}</span>
              <span className="text-xs text-gray-400 ml-1">achieved</span>
            </div>
          )}
          {item.overDelivered && item.surplus > 0 && (
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">+{item.surplus} over target</p>
          )}
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 w-40 shrink-0 justify-end">
          {item.pending > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              {item.pending} in progress
            </span>
          )}
          {item.rejected > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
              {item.rejected} rejected
            </span>
          )}
          {item.achieved > 0 && item.total === item.achieved && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BrandAnalyticsPage() {
  const params   = useParams();
  const router   = useRouter();
  const brandId  = params.brandId;

  const [refDate, setRefDate] = useState(new Date());
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [refDate, brandId]);

  async function fetchData() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/brands/${brandId}/analytics?date=${refDate.toISOString()}`);
      const json = await res.json();
      setData(json);
    } finally { setLoading(false); }
  }

  const monthLabel = format(refDate, 'MMMM yyyy');
  const sow        = data?.sowSummary;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="w-4 h-4 text-gray-400" />
            <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
            {data?.brand && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-300">·</span>
                {data.brand.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.brand.color }} />}
                <span className="text-sm font-medium text-gray-600">{data.brand.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Month navigator */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setRefDate((d) => subMonths(d, 1))} className="p-2 hover:bg-gray-50 transition-colors border-r border-gray-200">
                <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <span className="text-xs font-semibold text-gray-700 px-4 min-w-[130px] text-center">{monthLabel}</span>
              <button onClick={() => setRefDate((d) => addMonths(d, 1))} className="p-2 hover:bg-gray-50 transition-colors border-l border-gray-200">
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
            {/* SOW settings link */}
            <Link href={`/brands/${brandId}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-2 rounded-lg transition-colors">
              <Settings className="w-3.5 h-3.5" />Edit SOW
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5 max-w-5xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : !data ? null : (
          <>
            {/* ── SOW OVERVIEW ── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">SOW Progress — {monthLabel}</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {sow?.hasSowDefined ? 'Targets defined · ' : 'No SOW targets set · '}
                      {sow?.totalTasks || 0} tasks this month
                    </p>
                  </div>
                </div>
                {!sow?.hasSowDefined && (
                  <Link href={`/brands/${brandId}`}
                    className="text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    + Define SOW targets
                  </Link>
                )}
              </div>

              {sow && sow.totalTasks === 0 ? (
                <div className="text-center py-10">
                  <Target className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No tasks created in {monthLabel}</p>
                </div>
              ) : sow && (
                <div className="px-5 py-5 space-y-5">
                  {/* Overall progress bar */}
                  {sow.totalTarget && (
                    <div className="space-y-2">
                      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            sow.percentComplete === 100 ? 'bg-emerald-500' :
                            sow.percentComplete >= 70  ? 'bg-indigo-500'  :
                            sow.percentComplete >= 40  ? 'bg-amber-400'   : 'bg-red-400'
                          }`}
                          style={{ width: `${sow.percentComplete}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          <span className="font-bold text-gray-900 text-lg">{sow.totalAchieved}</span>
                          <span className="text-gray-400"> of </span>
                          <span className="font-bold text-gray-900 text-lg">{sow.totalTarget}</span>
                          <span className="text-gray-400"> total deliverables achieved</span>
                        </span>
                        <span className={`text-xl font-bold ${sow.percentComplete === 100 ? 'text-emerald-600' : sow.percentComplete >= 70 ? 'text-indigo-600' : sow.percentComplete >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                          {sow.percentComplete}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Summary stats */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Committed',   value: sow.totalTarget ?? sow.totalTasks, color: 'bg-gray-50 border-gray-200',    v: 'text-gray-900'    },
                      { label: 'Achieved',    value: sow.totalAchieved,                 color: 'bg-emerald-50 border-emerald-200', v: 'text-emerald-700' },
                      { label: 'In Progress', value: sow.totalPending,                  color: 'bg-indigo-50 border-indigo-200',   v: 'text-indigo-700'  },
                      { label: 'Rejected',    value: sow.totalRejected,                 color: 'bg-red-50 border-red-200',         v: 'text-red-600'     },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.v}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Carry-overs notice */}
                  {sow.carryOvers?.filter((c) => c.confirmedByAM).length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">Applied carry-overs</p>
                        <div className="text-xs text-amber-700 mt-1 space-y-0.5">
                          {sow.carryOvers.filter((c) => c.confirmedByAM).map((co) => (
                            <p key={co.type}>• {co.type}: {co.amount > 0 ? '+' : ''}{co.amount} from {co.fromMonth}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── SOW BY CONTENT TYPE ── */}
            {data.sowByType?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Deliverables by Type
                    <span className="ml-2 text-xs font-normal text-gray-400">({data.sowByType.length} types)</span>
                  </h2>
                  <button
                    onClick={() => exportCSV(data.taskList, `${data.brand?.name}-sow-${format(refDate, 'yyyy-MM')}.csv`)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />Export CSV
                  </button>
                </div>

                {/* Column headers */}
                <div className="grid px-5 py-2.5 bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: '144px 1fr 128px 160px' }}>
                  {['Type', 'Progress', 'Achieved / Target', 'Status'].map((h) => (
                    <p key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
                  ))}
                </div>

                {data.sowByType.map((item) => <SOWTypeRow key={item.type} item={item} />)}
              </div>
            )}

            {/* ── TEAM PERFORMANCE ── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Team Performance</h2>
                <button
                  onClick={() => exportCSV(data.userStats.map((u) => ({ Name: u.name, Role: u.role, Assigned: u.assigned, Achieved: u.completed, Revisions: u.totalRevisions })), `${data.brand?.name}-team-${format(refDate, 'yyyy-MM')}.csv`)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />Export CSV
                </button>
              </div>

              {data.userStats.length === 0 ? (
                <p className="px-5 py-8 text-sm text-gray-400">No team data for this period</p>
              ) : (
                <>
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                    {['Member', 'Role', 'Assigned', 'Achieved', 'Progress'].map((h) => (
                      <p key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
                    ))}
                  </div>
                  {data.userStats.map((u) => {
                    const pct = u.assigned > 0 ? Math.round((u.completed / u.assigned) * 100) : 0;
                    return (
                      <div key={u._id} className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-indigo-700">{u.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                            {u.totalRevisions > 0 && <p className="text-[10px] text-amber-500">↺ {u.totalRevisions} revision{u.totalRevisions !== 1 ? 's' : ''}</p>}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 capitalize self-center">{u.role?.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-gray-700 self-center">{u.assigned}</span>
                        <span className="text-sm font-semibold text-emerald-600 self-center">{u.completed}</span>
                        <div className="self-center">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-400'}`} style={{ width: `${pct}%` }} />
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