// src/app/(dashboard)/analytics/page.jsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  format, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek,
} from 'date-fns';
import {
  BarChart2, ChevronLeft, ChevronRight, Target, TrendingUp, TrendingDown,
  Wallet, CheckCircle2, AlertTriangle, ArrowRight, Activity, Users,
  Filter, ArrowUpDown,
} from 'lucide-react';

// ── Formatting helpers ────────────────────────────────────────────────────
function formatINR(n) {
  if (n == null || isNaN(n)) return '₹0';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
function formatINRCompact(n) {
  if (n == null || isNaN(n)) return '₹0';
  const abs = Math.abs(n);
  if (abs >= 10000000) return `${n < 0 ? '-' : ''}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000)   return `${n < 0 ? '-' : ''}₹${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000)     return `${n < 0 ? '-' : ''}₹${(abs / 1000).toFixed(1)}K`;
  return `${n < 0 ? '-' : ''}₹${abs}`;
}
function signedINR(n) {
  if (n == null || isNaN(n)) return '₹0';
  const sign = n > 0 ? '+' : n < 0 ? '-' : '';
  return `${sign}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;
}

// ── Visual configs ────────────────────────────────────────────────────────
const HEALTH_CONFIG = {
  healthy:   { label: 'Healthy',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  over:      { label: 'Over-delivered', cls: 'bg-violet-50 text-violet-700 border-violet-200',    dot: 'bg-violet-500'  },
  at_risk:   { label: 'At Risk',        cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
  critical:  { label: 'Critical',       cls: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500'     },
  no_scope:  { label: 'No SOW',         cls: 'bg-gray-50 text-gray-500 border-gray-200',          dot: 'bg-gray-400'    },
  inactive:  { label: 'Inactive',       cls: 'bg-gray-50 text-gray-400 border-gray-200',          dot: 'bg-gray-300'    },
};

function getBarColor(percent) {
  if (percent >= 100) return 'bg-emerald-500';
  if (percent >= 70)  return 'bg-indigo-500';
  if (percent >= 40)  return 'bg-amber-400';
  return 'bg-red-400';
}

// ── Components ────────────────────────────────────────────────────────────
function RevenueHero({ revenue, activeBrandsCount, totalBrandsCount, periodLabel }) {
  const { scopeValue, deliveredValue, variance, deliveredPercent } = revenue;
  const isOver  = variance > 0;
  const isZero  = scopeValue === 0;
  const varCls  = isZero ? 'text-gray-400' : isOver ? 'text-emerald-300' : 'text-red-300';

  return (
    <div className="rounded-2xl p-6 text-white shadow-sm relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)' }}>
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-3xl"
           style={{ background: '#fff', transform: 'translate(30%, -30%)' }} />

      <div className="relative">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 opacity-80" />
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">Revenue Health</p>
            </div>
            <p className="text-xs opacity-70">{periodLabel} · {activeBrandsCount} of {totalBrandsCount} brands with active SOW</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm font-medium">
            {isZero ? 'No data' : `${deliveredPercent}% delivered`}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-5">
          <div>
            <p className="text-[11px] uppercase tracking-wider opacity-75 mb-1.5">Scope ₹</p>
            <p className="text-3xl font-bold tabular-nums">{formatINRCompact(scopeValue)}</p>
            <p className="text-[11px] opacity-60 mt-0.5 tabular-nums">{formatINR(scopeValue)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider opacity-75 mb-1.5">Delivered ₹</p>
            <p className="text-3xl font-bold tabular-nums">{formatINRCompact(deliveredValue)}</p>
            <p className="text-[11px] opacity-60 mt-0.5 tabular-nums">{formatINR(deliveredValue)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider opacity-75 mb-1.5">Variance</p>
            <div className="flex items-center gap-2">
              {!isZero && (isOver ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />)}
              <p className={`text-3xl font-bold tabular-nums ${varCls}`}>
                {isZero ? '—' : signedINR(variance).replace(/^([+-])₹/, '$1₹')}
              </p>
            </div>
            <p className="text-[11px] opacity-60 mt-0.5">
              {isZero ? 'No SOW defined' : isOver ? 'Over-delivered' : 'Under-delivered'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {!isZero && (
          <div>
            <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${Math.min(deliveredPercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KPIStrip({ overall, activeBrandsCount, totalBrandsCount }) {
  const avgDeliveryPercent = overall.percentComplete;
  const kpis = [
    { label: 'Tasks Achieved',  value: overall.achieved, accent: 'text-emerald-600', icon: CheckCircle2, iconBg: 'bg-emerald-50' },
    { label: 'In Progress',     value: overall.pending,  accent: 'text-indigo-600',  icon: Activity,     iconBg: 'bg-indigo-50' },
    { label: 'Active Brands',   value: `${activeBrandsCount}/${totalBrandsCount}`, accent: 'text-gray-900', icon: Users, iconBg: 'bg-gray-50' },
    { label: 'Avg Delivery',    value: `${avgDeliveryPercent}%`, accent: avgDeliveryPercent >= 70 ? 'text-emerald-600' : avgDeliveryPercent >= 40 ? 'text-amber-600' : 'text-red-500', icon: Target, iconBg: 'bg-amber-50' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <div key={k.label} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${k.iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${k.accent}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{k.label}</p>
              <p className={`text-xl font-bold ${k.accent} tabular-nums`}>{k.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BrandCard({ brand, periodLabel }) {
  const { sowProgress, budgetSummary, health } = brand;
  const healthCfg = HEALTH_CONFIG[health];
  const hasMoney  = budgetSummary.scopeValue > 0;
  const isOver    = budgetSummary.variance > 0;

  return (
    <Link href={`/brands/${brand._id}/analytics`}
      className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all group">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
               style={{ background: brand.color || '#4f46e5' }}>
            {brand.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{brand.name}</p>
            <p className="text-[11px] text-gray-400">{periodLabel}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ml-2 flex items-center gap-1.5 ${healthCfg.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${healthCfg.dot}`} />
          {healthCfg.label}
        </span>
      </div>

      {/* Money row — primary signal */}
      {hasMoney ? (
        <div className="px-5 py-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Scope</p>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{formatINRCompact(budgetSummary.scopeValue)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Delivered</p>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{formatINRCompact(budgetSummary.deliveredValue)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Variance</p>
              <p className={`text-sm font-bold tabular-nums ${isOver ? 'text-emerald-600' : budgetSummary.variance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {budgetSummary.variance === 0
                  ? '—'
                  : (budgetSummary.variance > 0 ? '+' : '-') + formatINRCompact(Math.abs(budgetSummary.variance))}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getBarColor(budgetSummary.deliveredPercent)}`}
                style={{ width: `${Math.min(budgetSummary.deliveredPercent, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">{budgetSummary.deliveredPercent}% of scope value delivered</p>
          </div>
        </div>
      ) : (
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-[11px] text-gray-400">
            <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5" />
            No SOW defined for this month
          </p>
        </div>
      )}

      {/* Task stats */}
      <div className="px-5 py-4">
        {sowProgress.total === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">No tasks this period</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center py-2 bg-emerald-50 rounded-lg">
              <p className="text-base font-bold text-emerald-700 tabular-nums">{sowProgress.achieved}</p>
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Achieved</p>
            </div>
            <div className="text-center py-2 bg-indigo-50 rounded-lg">
              <p className="text-base font-bold text-indigo-700 tabular-nums">{sowProgress.pending}</p>
              <p className="text-[10px] text-indigo-500 font-medium mt-0.5">In Progress</p>
            </div>
            <div className="text-center py-2 bg-red-50 rounded-lg">
              <p className="text-base font-bold text-red-600 tabular-nums">{sowProgress.rejected}</p>
              <p className="text-[10px] text-red-400 font-medium mt-0.5">Rejected</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 group-hover:text-indigo-600 transition-colors">
        <span>View detailed analytics</span>
        <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

function TopPerformers({ teamStats }) {
  const top = teamStats.slice(0, 8); // bumped to 8 now that this section has full width

  if (top.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Top Performers</h2>
        <p className="text-xs text-gray-400">No team activity for this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Top Performers</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">By tasks delivered across all brands</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[24px_1fr_72px_96px_96px] px-5 py-2.5 bg-gray-50 border-b border-gray-100">
        {['#', 'Member', 'Assigned', 'Achieved', 'Completion'].map((h, i) => (
          <p key={h} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wide ${i > 1 ? 'text-right' : ''}`}>{h}</p>
        ))}
      </div>
      <div className="divide-y divide-gray-50">
        {top.map((u, idx) => (
          <div key={u._id} className="grid grid-cols-[24px_1fr_72px_96px_96px] px-5 py-3 items-center hover:bg-gray-50 transition-colors">
            <span className="text-xs font-bold text-gray-400 tabular-nums">{idx + 1}</span>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-indigo-700">{u.name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                <p className="text-[10px] text-gray-400 capitalize">{u.role?.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <span className="text-sm text-gray-700 tabular-nums text-right">{u.assigned}</span>
            <span className="text-sm font-semibold text-emerald-600 tabular-nums text-right">{u.completed}</span>
            <div className="flex items-center gap-2 justify-end">
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${u.completionRate === 100 ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                     style={{ width: `${u.completionRate}%` }} />
              </div>
              <span className="text-[11px] font-semibold text-gray-600 tabular-nums w-8 text-right">{u.completionRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod]     = useState('month');
  const [refDate, setRefDate]   = useState(new Date());
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [sortBy, setSortBy]     = useState('activity'); // activity | variance | delivery | name
  const [healthFilter, setHealthFilter] = useState('all');

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

  const periodLabel = useMemo(() => {
    if (period === 'week') {
      const s = startOfWeek(refDate, { weekStartsOn: 1 });
      const e = endOfWeek(refDate,   { weekStartsOn: 1 });
      return `${format(s, 'dd MMM')} – ${format(e, 'dd MMM yyyy')}`;
    }
    return format(refDate, 'MMMM yyyy');
  }, [period, refDate]);

  const filteredSortedBrands = useMemo(() => {
    if (!data?.brandStats) return [];
    let list = [...data.brandStats];
    if (healthFilter !== 'all') {
      list = list.filter((b) => b.health === healthFilter);
    }
    switch (sortBy) {
      case 'variance':
        list.sort((a, b) => a.budgetSummary.variance - b.budgetSummary.variance); // most negative first (risk)
        break;
      case 'delivery':
        list.sort((a, b) => b.budgetSummary.deliveredPercent - a.budgetSummary.deliveredPercent);
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'activity':
      default:
        list.sort((a, b) => b.sowProgress.total - a.sowProgress.total);
    }
    return list;
  }, [data, sortBy, healthFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="w-4 h-4 text-gray-400" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Agency Analytics</h1>
              <p className="text-xs text-gray-400 mt-0.5">Revenue health, delivery, and team performance across all brands</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {['week', 'month'].map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                    period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={prev} className="p-2 hover:bg-gray-50 transition-colors border-r border-gray-200">
                <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <span className="text-xs font-medium text-gray-700 px-4 min-w-[140px] text-center">{periodLabel}</span>
              <button onClick={next} className="p-2 hover:bg-gray-50 transition-colors border-l border-gray-200">
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : !data ? null : (
          <>
            {/* Revenue Hero */}
            <RevenueHero
              revenue={data.revenueSummary}
              activeBrandsCount={data.activeBrandsCount}
              totalBrandsCount={data.totalBrandsCount}
              periodLabel={periodLabel}
            />

            {/* KPI Strip */}
            <KPIStrip
              overall={data.overallSOW}
              activeBrandsCount={data.activeBrandsCount}
              totalBrandsCount={data.totalBrandsCount}
            />

            {/* Top Performers — full width now */}
            <TopPerformers teamStats={data.teamStats} />

            {/* Brand Cards with sort/filter */}
            {data.brandStats?.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
                <BarChart2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">No brands found</p>
                <p className="text-xs mt-1">Create brands to track SOW progress</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      By Brand
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        ({filteredSortedBrands.length} of {data.brandStats.length})
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Click a brand for detailed breakdown</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                      <Filter className="w-3 h-3 text-gray-400" />
                      <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}
                        className="text-xs bg-transparent border-none outline-none text-gray-700 cursor-pointer">
                        <option value="all">All health</option>
                        <option value="healthy">Healthy</option>
                        <option value="over">Over-delivered</option>
                        <option value="at_risk">At Risk</option>
                        <option value="critical">Critical</option>
                        <option value="no_scope">No SOW</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs bg-transparent border-none outline-none text-gray-700 cursor-pointer">
                        <option value="activity">Most active</option>
                        <option value="variance">Worst variance</option>
                        <option value="delivery">Best delivery %</option>
                        <option value="name">Name (A–Z)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {filteredSortedBrands.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                    <p className="text-sm text-gray-400">No brands match the current filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredSortedBrands.map((brand) => (
                      <BrandCard key={brand._id} brand={brand} periodLabel={periodLabel} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}