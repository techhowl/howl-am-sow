// src/app/(dashboard)/analytics/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  format, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek,
} from 'date-fns';
import {
  BarChart2, ChevronLeft, ChevronRight, Target,
  CheckCircle2, Clock, RotateCcw, ArrowRight,
} from 'lucide-react';

const PRIORITY_CONFIG = {
  high:   { label: 'High',   dot: 'bg-red-500',  bar: 'bg-red-400',  text: 'text-red-600'   },
  medium: { label: 'Medium', dot: 'bg-amber-500', bar: 'bg-amber-400',text: 'text-amber-600' },
  low:    { label: 'Low',    dot: 'bg-gray-400',  bar: 'bg-gray-400', text: 'text-gray-500'  },
};

function ProgressBar({ percent, colorClass }) {
  return (
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function getBarColor(percent) {
  if (percent === 100) return 'bg-emerald-500';
  if (percent >= 70)   return 'bg-indigo-500';
  if (percent >= 40)   return 'bg-amber-400';
  return 'bg-red-400';
}

function getTextColor(percent) {
  if (percent === 100) return 'text-emerald-600';
  if (percent >= 70)   return 'text-indigo-600';
  if (percent >= 40)   return 'text-amber-600';
  return 'text-red-500';
}

function getBadge(percent) {
  if (percent === 100) return { label: '🎯 Complete',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (percent >= 70)   return { label: '🔵 On Track',  cls: 'bg-indigo-50  text-indigo-700  border-indigo-200'  };
  if (percent >= 40)   return { label: '🟡 In Progress',cls: 'bg-amber-50   text-amber-700   border-amber-200'   };
  if (percent > 0)     return { label: '🔴 Behind',    cls: 'bg-red-50     text-red-700     border-red-200'     };
  return                      { label: '⬜ No Tasks',  cls: 'bg-gray-50    text-gray-500    border-gray-200'    };
}

// ── Brand SOW Card ─────────────────────────────────────────────────────────
function BrandSOWCard({ brand, period, refDate }) {
  const sow    = brand.sowProgress;
  const badge  = getBadge(sow.percentComplete);
  const periodStr = period === 'week'
    ? `${format(startOfWeek(refDate, { weekStartsOn: 1 }), 'dd MMM')} – ${format(endOfWeek(refDate, { weekStartsOn: 1 }), 'dd MMM')}`
    : format(refDate, 'MMMM yyyy');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: brand.color || '#4f46e5' }}
          >
            {brand.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{brand.name}</p>
            <p className="text-[11px] text-gray-400">{periodStr}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ml-2 ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* SOW progress */}
      <div className="px-5 py-4 space-y-3">
        {sow.total === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">No tasks this period</p>
        ) : (
          <>
            {/* Main bar */}
            <div className="space-y-1.5">
              <ProgressBar percent={sow.percentComplete} colorClass={getBarColor(sow.percentComplete)} />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-800">{sow.achieved}</span>
                  <span className="text-gray-400"> / {sow.total} tasks achieved</span>
                </span>
                <span className={`text-sm font-bold ${getTextColor(sow.percentComplete)}`}>
                  {sow.percentComplete}%
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="text-center py-2 bg-emerald-50 rounded-xl">
                <p className="text-base font-bold text-emerald-700">{sow.achieved}</p>
                <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Achieved</p>
              </div>
              <div className="text-center py-2 bg-indigo-50 rounded-xl">
                <p className="text-base font-bold text-indigo-700">{sow.pending}</p>
                <p className="text-[10px] text-indigo-500 font-medium mt-0.5">In Progress</p>
              </div>
              <div className="text-center py-2 bg-red-50 rounded-xl">
                <p className="text-base font-bold text-red-600">{sow.rejected}</p>
                <p className="text-[10px] text-red-400 font-medium mt-0.5">Rejected</p>
              </div>
            </div>

            {/* Priority bars */}
            {brand.prioritySOW?.length > 0 && (
              <div className="pt-1 space-y-2">
                {brand.prioritySOW.map((p) => {
                  const cfg = PRIORITY_CONFIG[p.priority];
                  return (
                    <div key={p.priority} className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1 w-14 shrink-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span className={`text-[10px] font-medium ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cfg.bar}`}
                          style={{ width: `${p.percentComplete}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 w-16 text-right shrink-0">
                        <span className="font-semibold text-gray-600">{p.achieved}</span>/{p.total}
                        <span className={`ml-1 font-semibold ${cfg.text}`}>{p.percentComplete}%</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer link */}
      <div className="px-5 py-3 border-t border-gray-100">
        <Link
          href={`/brands/${brand._id}/analytics`}
          className="flex items-center justify-between text-xs text-gray-400 hover:text-indigo-600 transition-colors group"
        >
          <span>View detailed analytics</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod]   = useState('month');
  const [refDate, setRefDate] = useState(new Date());
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [period, refDate]);

  async function fetchData() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/analytics?period=${period}&date=${refDate.toISOString()}`);
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

  const overall = data?.overallSOW;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="w-4 h-4 text-gray-400" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">SOW Analytics</h1>
              <p className="text-xs text-gray-400 mt-0.5">Statement of Work — all brands</p>
            </div>
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

      <div className="px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : !data ? null : (
          <>
            {/* ── OVERALL SOW SUMMARY ── */}
            {overall && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Overall SOW — All Brands</h2>
                  <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full border ${getBadge(overall.percentComplete).cls}`}>
                    {getBadge(overall.percentComplete).label}
                  </span>
                </div>

                {overall.total === 0 ? (
                  <p className="text-sm text-gray-400">No tasks created this period across any brand.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Big progress bar */}
                    <div className="space-y-2">
                      <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getBarColor(overall.percentComplete)}`}
                          style={{ width: `${overall.percentComplete}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          <span className="font-bold text-gray-900 text-lg">{overall.achieved}</span>
                          <span className="text-gray-400"> of </span>
                          <span className="font-bold text-gray-900 text-lg">{overall.total}</span>
                          <span className="text-gray-400"> tasks achieved across all brands</span>
                        </span>
                        <span className={`text-xl font-bold ${getTextColor(overall.percentComplete)}`}>
                          {overall.percentComplete}%
                        </span>
                      </div>
                    </div>

                    {/* Summary stats */}
                    <div className="grid grid-cols-4 gap-3 pt-1">
                      {[
                        { label: 'SOW Committed', value: overall.total,    color: 'bg-gray-50    border-gray-200',   v: 'text-gray-900'    },
                        { label: 'Achieved',       value: overall.achieved, color: 'bg-emerald-50 border-emerald-200',v: 'text-emerald-700' },
                        { label: 'In Progress',    value: overall.pending,  color: 'bg-indigo-50  border-indigo-200', v: 'text-indigo-700'  },
                        { label: 'Rejected',       value: overall.rejected, color: 'bg-red-50     border-red-200',    v: 'text-red-600'     },
                      ].map((s) => (
                        <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
                          <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                          <p className={`text-2xl font-bold ${s.v}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── BRAND CARDS GRID ── */}
            {data.brandStats?.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <BarChart2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">No brands found</p>
                <p className="text-xs mt-1">Create brands to track SOW progress</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">
                    By Brand
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ({data.brandStats.length} brand{data.brandStats.length !== 1 ? 's' : ''})
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400">Click a brand to see detailed analytics</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.brandStats.map((brand) => (
                    <BrandSOWCard
                      key={brand._id}
                      brand={brand}
                      period={period}
                      refDate={refDate}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}