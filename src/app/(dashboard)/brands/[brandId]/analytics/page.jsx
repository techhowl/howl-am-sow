// src/app/(dashboard)/brands/[brandId]/analytics/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, addMonths, subMonths } from 'date-fns';
import { BarChart2, ChevronLeft, ChevronRight, Download, ArrowLeft, Target, CheckCircle2, AlertTriangle, Settings } from 'lucide-react';
import Link from 'next/link';
import ScopeVarianceSection from '@/components/brands/ScopeVarianceSection';
import { Skeleton, SkeletonStatCards, SkeletonTable } from '@/components/shared/Skeleton';

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
  if (overDelivered) return 'bg-success';
  if (percent === 100) return 'bg-success';
  if (percent >= 70)   return 'bg-primary';
  if (percent >= 40)   return 'bg-warning';
  return 'bg-destructive';
}

function getTextColor(percent, overDelivered) {
  if (overDelivered || percent === 100) return 'text-success';
  if (percent >= 70)   return 'text-primary';
  if (percent >= 40)   return 'text-warning';
  return 'text-destructive';
}

function SOWTypeRow({ item }) {
  const hasTarget = item.target !== null;
  const pct       = item.percentComplete;
  const barColor  = getBarColor(pct, item.overDelivered);
  const textColor = getTextColor(pct, item.overDelivered);

  return (
    <div className="px-5 py-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-36 shrink-0">
          <p className="text-sm font-semibold text-foreground">{item.type}</p>
          {!hasTarget && (
            <p className="text-[10px] text-muted-foreground mt-0.5">No SOW target</p>
          )}
        </div>
        <div className="flex-1">
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
        <div className="w-32 shrink-0 text-right">
          {hasTarget ? (
            <div>
              <span className={`text-sm font-bold ${textColor}`}>{item.achieved}</span>
              <span className="text-sm text-muted-foreground"> / {item.target}</span>
              <span className={`ml-2 text-xs font-semibold ${textColor}`}>{pct}%</span>
            </div>
          ) : (
            <div>
              <span className="text-sm font-bold text-foreground">{item.achieved}</span>
              <span className="text-xs text-muted-foreground ml-1">achieved</span>
            </div>
          )}
          {item.overDelivered && item.surplus > 0 && (
            <p className="text-[10px] text-success font-medium mt-0.5">+{item.surplus} over target</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 w-40 shrink-0 justify-end">
          {item.pending > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/40">
              {item.pending} in progress
            </span>
          )}
          {item.rejected > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30">
              {item.rejected} rejected
            </span>
          )}
          {item.achieved > 0 && item.total === item.achieved && (
            <CheckCircle2 className="w-4 h-4 text-success" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandAnalyticsPage() {
  const params   = useParams();
  const router   = useRouter();
  const brandId  = params.brandId;

  const [refDate, setRefDate] = useState(new Date());
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => { fetchData(); }, [refDate, brandId]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/brands/${brandId}/analytics?date=${refDate.toISOString()}`);
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

  const monthLabel = format(refDate, 'MMMM yyyy');
  const sow        = data?.sowSummary;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-6 pt-5 pb-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <h1 className="text-lg font-display text-foreground">Analytics</h1>
            {data?.brand && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">·</span>
                {data.brand.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.brand.color }} />}
                <span className="text-sm font-medium text-muted-foreground">{data.brand.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button onClick={() => setRefDate((d) => subMonths(d, 1))} className="p-2 hover:bg-muted transition-colors border-r border-border">
                <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-xs font-semibold text-foreground px-4 min-w-[130px] text-center">{monthLabel}</span>
              <button onClick={() => setRefDate((d) => addMonths(d, 1))} className="p-2 hover:bg-muted transition-colors border-l border-border">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <Link href={`/brands/${brandId}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-border hover:border-primary/40 px-3 py-2 rounded-lg transition-colors">
              <Settings className="w-3.5 h-3.5" />Edit SOW
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5 max-w-6xl">
        {loading ? (
          <>
            {/* SOW Progress card: header + progress bar + 4 stat cards */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="mt-2 h-3 w-32" />
                </div>
              </div>
              <Skeleton className="mt-5 h-4 w-full rounded-full" />
              <SkeletonStatCards count={4} className="mt-5 grid-cols-4" />
            </div>

            {/* Scope & Variance section */}
            <Skeleton className="h-64 w-full rounded-2xl" />

            {/* Deliverables by Type table */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <Skeleton className="h-4 w-44" />
              <div className="mt-4">
                <SkeletonTable rows={6} />
              </div>
            </div>

            {/* Team Performance table */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <Skeleton className="h-4 w-40" />
              <div className="mt-4">
                <SkeletonTable rows={6} />
              </div>
            </div>
          </>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-sm text-destructive">
            {error}
          </div>
        ) : !data ? null : (
          <>
            {/* SOW OVERVIEW */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">SOW Progress — {monthLabel}</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {sow?.hasSowDefined ? 'Targets defined · ' : 'No SOW targets set · '}
                      {sow?.totalTasks || 0} tasks this month
                    </p>
                  </div>
                </div>
                {!sow?.hasSowDefined && (
                  <Link href={`/brands/${brandId}`}
                    className="text-xs text-primary border border-primary/40 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    + Define SOW targets
                  </Link>
                )}
              </div>
              {sow && sow.totalTasks === 0 ? (
                <div className="text-center py-10">
                  <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No tasks created in {monthLabel}</p>
                </div>
              ) : sow && (
                <div className="px-5 py-5 space-y-5">
                  {sow.totalTarget && (
                    <div className="space-y-2">
                      <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            sow.percentComplete === 100 ? 'bg-success' :
                            sow.percentComplete >= 70  ? 'bg-primary'  :
                            sow.percentComplete >= 40  ? 'bg-warning'   : 'bg-destructive'
                          }`}
                          style={{ width: `${sow.percentComplete}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          <span className="font-bold text-foreground text-lg">{sow.totalAchieved}</span>
                          <span className="text-muted-foreground"> of </span>
                          <span className="font-bold text-foreground text-lg">{sow.totalTarget}</span>
                          <span className="text-muted-foreground"> total deliverables achieved</span>
                        </span>
                        <span className={`text-xl font-bold ${sow.percentComplete === 100 ? 'text-success' : sow.percentComplete >= 70 ? 'text-primary' : sow.percentComplete >= 40 ? 'text-warning' : 'text-destructive'}`}>
                          {sow.percentComplete}%
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Committed',   value: sow.totalTarget ?? sow.totalTasks, color: 'bg-muted border-border',    v: 'text-foreground'    },
                      { label: 'Achieved',    value: sow.totalAchieved,                 color: 'bg-success/10 border-success/30', v: 'text-success' },
                      { label: 'In Progress', value: sow.totalPending,                  color: 'bg-primary/10 border-primary/40',   v: 'text-primary'  },
                      { label: 'Rejected',    value: sow.totalRejected,                 color: 'bg-destructive/10 border-destructive/30',         v: 'text-destructive'     },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
                        <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.v}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {sow.carryOvers?.filter((c) => c.confirmedByAM).length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-warning">Applied carry-overs</p>
                        <div className="text-xs text-warning mt-1 space-y-0.5">
                          {sow.carryOvers.filter((c) => c.confirmedByAM).map((co) => (
                            <p key={co.type}>• {co.type}: {co.amount > 0 ? '+' : ''}{co.amount} units from {co.fromMonth}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SCOPE & VARIANCE (NEW) */}
            <ScopeVarianceSection
              budgetSummary={data.budgetSummary}
              sowByType={data.sowByType || []}
            />

            {/* SOW BY CONTENT TYPE (unit-level progress) */}
            {data.sowByType?.length > 0 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    Deliverables by Type
                    <span className="ml-2 text-xs font-normal text-muted-foreground">({data.sowByType.length} types)</span>
                  </h2>
                  <button
                    onClick={() => exportCSV(data.taskList, `${data.brand?.name}-sow-${format(refDate, 'yyyy-MM')}.csv`)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-border hover:border-primary/40 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />Export CSV
                  </button>
                </div>
                <div className="grid px-5 py-2.5 bg-muted border-b border-border" style={{ gridTemplateColumns: '144px 1fr 128px 160px' }}>
                  {['Type', 'Progress', 'Achieved / Target', 'Status'].map((h) => (
                    <p key={h} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
                  ))}
                </div>
                {data.sowByType.map((item) => <SOWTypeRow key={item.type} item={item} />)}
              </div>
            )}

            {/* TEAM PERFORMANCE */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Team Performance</h2>
                <button
                  onClick={() => exportCSV(data.userStats.map((u) => ({ Name: u.name, Role: u.role, Assigned: u.assigned, Achieved: u.completed, Revisions: u.totalRevisions })), `${data.brand?.name}-team-${format(refDate, 'yyyy-MM')}.csv`)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-border hover:border-primary/40 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />Export CSV
                </button>
              </div>
              {data.userStats.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground">No team data for this period</p>
              ) : (
                <>
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] px-5 py-2.5 bg-muted border-b border-border">
                    {['Member', 'Role', 'Assigned', 'Achieved', 'Progress'].map((h) => (
                      <p key={h} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
                    ))}
                  </div>
                  {data.userStats.map((u) => {
                    const pct = u.assigned > 0 ? Math.round((u.completed / u.assigned) * 100) : 0;
                    return (
                      <div key={u._id} className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-primary">{u.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.name}</p>
                            {u.totalRevisions > 0 && <p className="text-[10px] text-warning">↺ {u.totalRevisions} revision{u.totalRevisions !== 1 ? 's' : ''}</p>}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground capitalize self-center">{u.role?.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-foreground self-center">{u.assigned}</span>
                        <span className="text-sm font-semibold text-success self-center">{u.completed}</span>
                        <div className="self-center">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct === 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground w-7 text-right">{pct}%</span>
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
