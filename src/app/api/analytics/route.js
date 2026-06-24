// src/app/api/analytics/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Task from '@/lib/db/models/Task';
import Brand from '@/lib/db/models/Brand';
import SOW from '@/lib/db/models/SOW';
import User from '@/lib/db/models/User';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

// Health rating derived from delivery % AND variance.
// - critical: severely underdelivered (< 40%) AND has scope
// - at_risk:  underdelivered (40-69%) OR negative variance > 20% of scope
// - healthy:  on track (70%+) and variance not severely negative
// - over:     over-delivered (>100%) — could be good (extra value) or bad (scope creep)
function getHealthRating({ deliveredPercent, scopeValue, variance, totalTasks }) {
  if (totalTasks === 0 && scopeValue === 0) return 'inactive';
  if (scopeValue === 0)                      return 'no_scope';
  if (deliveredPercent > 100)                return 'over';
  if (deliveredPercent >= 80)                return 'healthy';
  if (deliveredPercent >= 50)                return 'at_risk';
  return 'critical';
}

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['superadmin', 'admin', 'account_manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();

    const { searchParams } = new URL(req.url);
    const period    = searchParams.get('period') || 'month';
    const dateParam = searchParams.get('date')   || new Date().toISOString();
    const refDate   = new Date(dateParam);

    let periodStart, periodEnd, sowMonth;
    if (period === 'week') {
      periodStart = startOfWeek(refDate, { weekStartsOn: 1 });
      periodEnd   = endOfWeek(refDate,   { weekStartsOn: 1 });
      // SOW is stored monthly — use the month containing refDate as the ₹ context
      sowMonth = format(refDate, 'yyyy-MM');
    } else {
      periodStart = startOfMonth(refDate);
      periodEnd   = endOfMonth(refDate);
      sowMonth    = format(refDate, 'yyyy-MM');
    }

    const brands = await Brand.find({ isActive: true }).lean();

    // Per-brand aggregates (in parallel)
    const brandStats = await Promise.all(
      brands.map(async (brand) => {
        const [tasks, sow] = await Promise.all([
          Task.find({
            brandId:   brand._id,
            createdAt: { $gte: periodStart, $lte: periodEnd },
          }).lean(),
          SOW.findOne({ brandId: brand._id, month: sowMonth }).lean(),
        ]);

        const achieved = tasks.filter((t) => ['approved', 'live'].includes(t.status));
        const pending  = tasks.filter((t) => !['approved', 'live', 'rejected'].includes(t.status));
        const rejected = tasks.filter((t) => t.status === 'rejected');

        // Money math — only meaningful if SOW exists for this brand+month
        let scopeValue = 0, deliveredValue = 0, variance = 0;
        if (sow?.items?.length) {
          // Count delivered units per type from the tasks for this period
          const achievedByType = {};
          achieved.forEach((t) => {
            achievedByType[t.type] = (achievedByType[t.type] || 0) + 1;
          });

          sow.items.forEach((item) => {
            const rate          = item.unitRate || 0;
            const target        = item.target   || 0;
            const deliveredUnits = achievedByType[item.type] || 0;
            scopeValue     += target         * rate;
            deliveredValue += deliveredUnits * rate;
          });
          variance = deliveredValue - scopeValue;
        }

        const percentComplete = tasks.length > 0
          ? Math.round((achieved.length / tasks.length) * 100)
          : 0;

        const deliveredPercent = scopeValue > 0
          ? Math.round((deliveredValue / scopeValue) * 100)
          : 0;

        const health = getHealthRating({
          deliveredPercent,
          scopeValue,
          variance,
          totalTasks: tasks.length,
        });

        // Priority breakdown (kept from old API — still useful in cards)
        const prioritySOW = ['high', 'medium', 'low'].map((p) => {
          const pt = tasks.filter((t) => t.priority === p);
          const pa = pt.filter((t) => ['approved', 'live'].includes(t.status));
          return {
            priority:        p,
            total:           pt.length,
            achieved:        pa.length,
            percentComplete: pt.length > 0 ? Math.round((pa.length / pt.length) * 100) : 0,
          };
        }).filter((p) => p.total > 0);

        return {
          _id:   brand._id,
          name:  brand.name,
          color: brand.color,
          health,
          hasSow: !!(sow?.items?.length),
          sowProgress: {
            total:           tasks.length,
            achieved:        achieved.length,
            pending:         pending.length,
            rejected:        rejected.length,
            percentComplete,
          },
          budgetSummary: {
            scopeValue,
            deliveredValue,
            variance,
            deliveredPercent,
          },
          prioritySOW,
        };
      })
    );

    // ── Agency-wide aggregates ────────────────────────────────────────────
    const allTasks = await Task.find({
      createdAt: { $gte: periodStart, $lte: periodEnd },
    }).populate('assignees', 'name role').lean();

    const overallSOW = {
      total:    allTasks.length,
      achieved: allTasks.filter((t) => ['approved', 'live'].includes(t.status)).length,
      pending:  allTasks.filter((t) => !['approved', 'live', 'rejected'].includes(t.status)).length,
      rejected: allTasks.filter((t) => t.status === 'rejected').length,
    };
    overallSOW.percentComplete = overallSOW.total > 0
      ? Math.round((overallSOW.achieved / overallSOW.total) * 100)
      : 0;

    // Agency revenue summary — sum of per-brand budget summaries
    const revenueSummary = brandStats.reduce(
      (acc, b) => {
        acc.scopeValue     += b.budgetSummary.scopeValue;
        acc.deliveredValue += b.budgetSummary.deliveredValue;
        return acc;
      },
      { scopeValue: 0, deliveredValue: 0 }
    );
    revenueSummary.variance         = revenueSummary.deliveredValue - revenueSummary.scopeValue;
    revenueSummary.deliveredPercent = revenueSummary.scopeValue > 0
      ? Math.round((revenueSummary.deliveredValue / revenueSummary.scopeValue) * 100)
      : 0;

    // Brands with active SOW (have items defined for this month)
    const activeBrandsCount = brandStats.filter((b) => b.hasSow).length;

    // ── Workflow bottleneck — task count per status across all brands ────
    const statusCounts = {
      copy_wip:        0,
      design_wip:      0,
      video_wip:       0,
      sent_to_client:  0,
      approved:        0,
      rejected:        0,
      live:            0,
    };
    allTasks.forEach((t) => {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
    });

    // ── Top performers — agency-wide team activity for this period ──────
    const userMap = new Map(); // userId -> { _id, name, role, assigned, completed, revisions }
    allTasks.forEach((task) => {
      (task.assignees || []).forEach((u) => {
        const id = String(u._id);
        if (!userMap.has(id)) {
          userMap.set(id, {
            _id:       id,
            name:      u.name,
            role:      u.role,
            assigned:  0,
            completed: 0,
            revisions: 0,
          });
        }
        const entry = userMap.get(id);
        entry.assigned += 1;
        if (['approved', 'live'].includes(task.status)) entry.completed += 1;
        entry.revisions += task.revisionCount || 0;
      });
    });
    const teamStats = Array.from(userMap.values())
      .map((u) => ({
        ...u,
        completionRate: u.assigned > 0 ? Math.round((u.completed / u.assigned) * 100) : 0,
      }))
      .sort((a, b) => b.completed - a.completed); // top deliverers first

    return NextResponse.json({
      period,
      periodStart,
      periodEnd,
      sowMonth,
      revenueSummary,
      overallSOW,
      activeBrandsCount,
      totalBrandsCount: brands.length,
      statusCounts,
      teamStats,
      brandStats: brandStats.sort((a, b) => b.sowProgress.total - a.sowProgress.total),
    });
  } catch (err) {
    console.error('GET /api/analytics error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}