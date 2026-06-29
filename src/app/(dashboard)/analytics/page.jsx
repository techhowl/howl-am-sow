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
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { IconMedallion } from '@/components/shared/IconMedallion';
import { AnimatedBar } from '@/components/shared/motion/AnimatedBar';
import { AnimatedNumber } from '@/components/shared/motion/AnimatedNumber';
import { BarChartCard, DonutChartCard, RadialGauge } from '@/components/charts/ChartCard';
import { AnimatedGradient } from '@/components/ui/animated-gradient-with-svg';

const HEALTH_VAR = {
  healthy:  'var(--success)',
  over:     'var(--color-chart-5)',
  at_risk:  'var(--warning)',
  critical: 'var(--destructive)',
  no_scope: 'var(--muted-foreground)',
  inactive: 'var(--muted-foreground)',
};

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
// ── Visual configs ────────────────────────────────────────────────────────
const HEALTH_CONFIG = {
  healthy:   { label: 'Healthy',        cls: 'bg-success/10 text-success border-success/30', dot: 'bg-success' },
  over:      { label: 'Over-delivered', cls: 'bg-[var(--color-chart-5)]/10 text-[var(--color-chart-5)] border-[var(--color-chart-5)]/30',    dot: 'bg-[var(--color-chart-5)]'  },
  at_risk:   { label: 'At Risk',        cls: 'bg-warning/10 text-warning border-warning/30',       dot: 'bg-warning'   },
  critical:  { label: 'Critical',       cls: 'bg-destructive/10 text-destructive border-destructive/30',             dot: 'bg-destructive'     },
  no_scope:  { label: 'No SOW',         cls: 'bg-muted text-muted-foreground border-border',          dot: 'bg-muted-foreground'    },
  inactive:  { label: 'Inactive',       cls: 'bg-muted text-muted-foreground border-border',          dot: 'bg-muted-foreground'    },
};

function getBarVar(percent) {
  if (percent >= 100) return 'var(--success)';
  if (percent >= 70)  return 'var(--primary)';
  if (percent >= 40)  return 'var(--warning)';
  return 'var(--destructive)';
}

// ── Components ────────────────────────────────────────────────────────────
function RevenueHero({ revenue, activeBrandsCount, totalBrandsCount, periodLabel }) {
  const { scopeValue, deliveredValue, variance, deliveredPercent } = revenue;
  const isOver  = variance > 0;
  const isZero  = scopeValue === 0;
  const varCls  = isZero ? 'text-muted-foreground' : isOver ? 'text-success' : 'text-destructive';
  
  // Gradient colors based on performance
  const gradientColors = isOver 
    ? ['oklch(0.60 0.16 165)', 'oklch(0.74 0.16 165)', 'oklch(0.52 0.17 300)'] // Success colors
    : deliveredPercent > 50 
    ? ['oklch(0.52 0.17 300)', 'oklch(0.60 0.12 268)', 'oklch(0.68 0.15 355)'] // Primary colors
    : ['oklch(0.68 0.15 45)', 'oklch(0.56 0.22 20)', 'oklch(0.68 0.16 300)']; // Warning colors

  return (
    <div className="surface-card shadow-md rounded-2xl p-6 relative overflow-hidden">
      {!isZero && (
        <AnimatedGradient colors={gradientColors} speed={0.02} blur="medium" />
      )}
      {/* Glass enhancement layer */}
      <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <p className="eyebrow">Revenue Health</p>
            </div>
            <p className="text-xs text-muted-foreground">{periodLabel} · {activeBrandsCount} of {totalBrandsCount} brands with active SOW</p>
          </div>
          {isZero
            ? <span className="text-xs px-3 py-1 rounded-full border border-border bg-muted text-muted-foreground font-medium">No data</span>
            : <RadialGauge value={Math.min(deliveredPercent, 100)} sub="DELIVERED" size={116} color="var(--primary)" />}
        </div>

        <div className="grid grid-cols-3 gap-6 md:gap-8 mb-6 divide-x divide-border">
          <div className="pr-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Scope ₹</p>
            <p className="editorial-h1 tabular-nums text-foreground">
              <AnimatedNumber value={scopeValue} format={formatINRCompact} />
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">{formatINR(scopeValue)}</p>
          </div>
          <div className="px-2 md:px-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Delivered ₹</p>
            <p className="editorial-h1 tabular-nums text-foreground">
              <AnimatedNumber value={deliveredValue} format={formatINRCompact} />
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">{formatINR(deliveredValue)}</p>
          </div>
          <div className="pl-2 md:pl-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Variance</p>
            <div className="flex items-center gap-2">
              {!isZero && (isOver
                ? <TrendingUp className="w-5 h-5 text-success" />
                : <TrendingDown className="w-5 h-5 text-destructive" />)}
              <p className={`editorial-h1 tabular-nums ${varCls}`}>
                {isZero
                  ? '—'
                  : <><span>{variance > 0 ? '+' : '-'}</span><AnimatedNumber value={Math.abs(variance)} format={formatINRCompact} /></>}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {isZero ? 'No SOW defined' : isOver ? 'Over-delivered' : 'Under-delivered'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function KPIStrip({ overall, activeBrandsCount, totalBrandsCount }) {
  const avgDeliveryPercent = overall.percentComplete;
  const kpis = [
    { label: 'Tasks Achieved',  value: overall.achieved, accent: 'text-success', icon: CheckCircle2, tone: '--success' },
    { label: 'In Progress',     value: overall.pending,  accent: 'text-primary',  icon: Activity,     tone: '--primary' },
    { label: 'Active Brands',   value: `${activeBrandsCount}/${totalBrandsCount}`, accent: 'text-foreground', icon: Users, tone: '--color-chart-4' },
    { label: 'Avg Delivery',    value: `${avgDeliveryPercent}%`, accent: avgDeliveryPercent >= 70 ? 'text-success' : avgDeliveryPercent >= 40 ? 'text-warning' : 'text-destructive', icon: Target, tone: avgDeliveryPercent >= 70 ? '--success' : avgDeliveryPercent >= 40 ? '--warning' : '--destructive' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((k, index) => {
        const Icon = k.icon;
        return (
          <motion.div 
            key={k.label} 
            className="surface-card p-4 flex items-center gap-3 relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4,
              delay: index * 0.05,
              ease: [0.22, 1, 0.36, 1]
            }}
            whileHover={{ y: -2 }}
          >
            {/* Subtle gradient on important KPIs */}
            {(k.label === 'Tasks Achieved' && overall.achieved > 50) && (
              <AnimatedGradient 
                colors={['oklch(0.60 0.16 165 / 0.1)', 'oklch(0.74 0.16 165 / 0.1)', 'transparent']}
                speed={0.02}
                blur="heavy"
              />
            )}
            <IconMedallion icon={Icon} tone={k.tone} size="lg" />
            <div className="min-w-0 relative z-10">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{k.label}</p>
              <motion.p 
                className={`text-xl font-bold ${k.accent} tabular-nums`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
              >
                {k.value}
              </motion.p>
            </div>
          </motion.div>
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
      className="surface-card surface-card-hover block overflow-hidden hover:border-primary/40 transition-all group">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
               style={{ background: brand.color || 'var(--color-chart-4)' }}>
            {brand.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{brand.name}</p>
            <p className="text-[11px] text-muted-foreground">{periodLabel}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ml-2 flex items-center gap-1.5 ${healthCfg.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${healthCfg.dot}`} />
          {healthCfg.label}
        </span>
      </div>

      {/* Money row — primary signal */}
      {hasMoney ? (
        <div className="px-5 py-4 bg-linear-to-br from-muted to-card border-b border-border">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Scope</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{formatINRCompact(budgetSummary.scopeValue)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Delivered</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{formatINRCompact(budgetSummary.deliveredValue)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Variance</p>
              <p className={`text-sm font-bold tabular-nums ${isOver ? 'text-success' : budgetSummary.variance < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {budgetSummary.variance === 0
                  ? '—'
                  : (budgetSummary.variance > 0 ? '+' : '-') + formatINRCompact(Math.abs(budgetSummary.variance))}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <AnimatedBar
              value={Math.min(budgetSummary.deliveredPercent, 100)}
              color={getBarVar(budgetSummary.deliveredPercent)}
              track="bg-muted"
              height={6}
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">{budgetSummary.deliveredPercent}% of scope value delivered</p>
          </div>
        </div>
      ) : (
        <div className="px-5 py-3 bg-muted border-b border-border">
          <p className="text-[11px] text-muted-foreground">
            <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5" />
            No SOW defined for this month
          </p>
        </div>
      )}

      {/* Task stats */}
      <div className="px-5 py-4">
        {sowProgress.total === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No tasks this period</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center py-2 bg-success/10 rounded-lg">
              <p className="text-base font-bold text-success tabular-nums">{sowProgress.achieved}</p>
              <p className="text-[10px] text-success font-medium mt-0.5">Achieved</p>
            </div>
            <div className="text-center py-2 bg-primary/10 rounded-lg">
              <p className="text-base font-bold text-primary tabular-nums">{sowProgress.pending}</p>
              <p className="text-[10px] text-primary font-medium mt-0.5">In Progress</p>
            </div>
            <div className="text-center py-2 bg-destructive/10 rounded-lg">
              <p className="text-base font-bold text-destructive tabular-nums">{sowProgress.rejected}</p>
              <p className="text-[10px] text-destructive font-medium mt-0.5">Rejected</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
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
      <div className="surface-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-2">Top Performers</h2>
        <p className="text-xs text-muted-foreground">No team activity for this period.</p>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <IconMedallion icon={Users} tone="--warning" size="md" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Top Performers</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">By tasks delivered across all brands</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[24px_1fr_72px_96px_96px] px-5 py-2.5 bg-muted border-b border-border">
        {['#', 'Member', 'Assigned', 'Achieved', 'Completion'].map((h, i) => (
          <p key={h} className={`text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${i > 1 ? 'text-right' : ''}`}>{h}</p>
        ))}
      </div>
      <div className="divide-y divide-border">
        {top.map((u, idx) => (
          <div key={u._id} className="grid grid-cols-[24px_1fr_72px_96px_96px] px-5 py-3 items-center hover:bg-muted transition-colors">
            <span className="text-xs font-bold text-muted-foreground tabular-nums">{idx + 1}</span>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-primary">{u.name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{u.role?.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <span className="text-sm text-foreground tabular-nums text-right">{u.assigned}</span>
            <span className="text-sm font-semibold text-success tabular-nums text-right">{u.completed}</span>
            <div className="flex items-center gap-2 justify-end">
              <AnimatedBar
                value={u.completionRate}
                color={u.completionRate === 100 ? 'var(--success)' : 'var(--primary)'}
                track="bg-muted"
                height={6}
                className="w-16"
              />
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums w-8 text-right">{u.completionRate}%</span>
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
  const [error, setError]       = useState('');
  const [sortBy, setSortBy]     = useState('activity'); // activity | variance | delivery | name
  const [healthFilter, setHealthFilter] = useState('all');

  useEffect(() => { fetchData(); }, [period, refDate]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/analytics?period=${period}&date=${refDate.toISOString()}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setData(null);
        setError(json?.error || 'Failed to load analytics');
        return;
      }
      setData(json);
    } catch {
      setData(null);
      setError('Failed to load analytics');
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

  const healthChart = useMemo(() => {
    if (!data?.brandStats) return [];
    const counts = {};
    for (const b of data.brandStats) counts[b.health] = (counts[b.health] || 0) + 1;
    return Object.entries(counts).map(([health, value]) => ({
      name: HEALTH_CONFIG[health]?.label || health,
      value,
      color: HEALTH_VAR[health] || 'var(--muted-foreground)',
    }));
  }, [data]);

  const deliveryChart = useMemo(() => {
    if (!data?.brandStats) return [];
    return [...data.brandStats]
      .filter((b) => b.budgetSummary?.deliveredPercent != null)
      .sort((a, b) => b.budgetSummary.deliveredPercent - a.budgetSummary.deliveredPercent)
      .slice(0, 8)
      .map((b) => ({
        name: b.name.length > 10 ? b.name.slice(0, 9) + '…' : b.name,
        delivered: Math.round(b.budgetSummary.deliveredPercent),
        color: getBarVar(b.budgetSummary.deliveredPercent),
      }));
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-5 backdrop-blur-xl">
        <PageHeader
          className="mb-0"
          eyebrow="ANALYTICS"
          title="Agency Analytics"
          lede="Revenue health, delivery, and team performance across all brands"
          actions={
            <>
              <div className="flex bg-muted rounded-lg p-0.5">
                {['week', 'month'].map((p) => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                      period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button onClick={prev} className="p-2 hover:bg-muted transition-colors border-r border-border">
                  <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <span className="text-xs font-medium text-foreground px-4 min-w-35 text-center">{periodLabel}</span>
                <button onClick={next} className="p-2 hover:bg-muted transition-colors border-l border-border">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </>
          }
        />
      </div>

      <div className="px-6 py-6 space-y-5 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
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
                Loading analytics...
              </motion.p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center py-20 text-sm text-destructive"
            >
              {error}
            </motion.div>
          ) : !data ? null : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-5"
            >
              {/* Revenue Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <RevenueHero
                  revenue={data.revenueSummary}
                  activeBrandsCount={data.activeBrandsCount}
                  totalBrandsCount={data.totalBrandsCount}
                  periodLabel={periodLabel}
                />
              </motion.div>

              {/* KPI Strip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <KPIStrip
                  overall={data.overallSOW}
                  activeBrandsCount={data.activeBrandsCount}
                  totalBrandsCount={data.totalBrandsCount}
                />
              </motion.div>

              {/* Charts — health mix + delivery leaders */}
              {data.brandStats?.length > 0 && (
                <motion.div 
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <DonutChartCard
                  eyebrow="PORTFOLIO"
                  title="Brand health mix"
                  data={healthChart}
                  centerLabel={data.brandStats.length}
                  centerSub="BRANDS"
                  height={260}
                />
                <BarChartCard
                  eyebrow="DELIVERY"
                  title="Top delivery % by brand"
                  data={deliveryChart}
                  xKey="name"
                  bars={[{ key: 'delivered', name: 'Delivered', color: 'var(--primary)' }]}
                  showValues
                  valueSuffix="%"
                  height={260}
                  />
                </motion.div>
              )}

              {/* Top Performers — full width now */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <TopPerformers teamStats={data.teamStats} />
              </motion.div>

              {/* Brand Cards with sort/filter */}
              {data.brandStats?.length === 0 ? (
                <motion.div 
                  className="surface-card rounded-2xl border border-border"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex flex-col items-center text-center py-12">
                    <span className="empty-art mb-4"><BarChart2 className="h-6 w-6" /></span>
                    <p className="eyebrow mb-2">NOTHING YET</p>
                    <p className="text-sm text-muted-foreground max-w-xs">No brands found. Create brands to track SOW progress.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <motion.div 
                    className="flex items-center justify-between flex-wrap gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      By Brand
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({filteredSortedBrands.length} of {data.brandStats.length})
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Click a brand for detailed breakdown</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5 backdrop-blur-md">
                      <Filter className="w-3 h-3 text-muted-foreground" />
                      <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}
                        className="text-xs bg-transparent border-none outline-none text-foreground cursor-pointer">
                        <option value="all">All health</option>
                        <option value="healthy">Healthy</option>
                        <option value="over">Over-delivered</option>
                        <option value="at_risk">At Risk</option>
                        <option value="critical">Critical</option>
                        <option value="no_scope">No SOW</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5 backdrop-blur-md">
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs bg-transparent border-none outline-none text-foreground cursor-pointer">
                        <option value="activity">Most active</option>
                        <option value="variance">Worst variance</option>
                        <option value="delivery">Best delivery %</option>
                        <option value="name">Name (A–Z)</option>
                      </select>
                    </div>
                  </div>
                  </motion.div>

                  {filteredSortedBrands.length === 0 ? (
                    <motion.div 
                      className="text-center py-12 bg-card rounded-2xl border border-border"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <p className="text-sm text-muted-foreground">No brands match the current filter.</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {filteredSortedBrands.map((brand, index) => (
                        <motion.div
                          key={brand._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.4, 
                            delay: 0.3 + index * 0.05,
                            ease: [0.22, 1, 0.36, 1]
                          }}
                        >
                          <BrandCard brand={brand} periodLabel={periodLabel} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}