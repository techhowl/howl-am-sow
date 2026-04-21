// src/app/api/analytics/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Task from '@/lib/db/models/Task';
import Brand from '@/lib/db/models/Brand';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['admin', 'account_manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month'; // week | month
    const dateParam = searchParams.get('date') || new Date().toISOString();

    const refDate = new Date(dateParam);

    let periodStart, periodEnd;
    if (period === 'week') {
      periodStart = startOfWeek(refDate, { weekStartsOn: 1 }); // Mon
      periodEnd = endOfWeek(refDate, { weekStartsOn: 1 });
    } else {
      periodStart = startOfMonth(refDate);
      periodEnd = endOfMonth(refDate);
    }

    // All tasks in period
    const allTasks = await Task.find({
      createdAt: { $gte: periodStart, $lte: periodEnd },
    })
      .populate('assignees', 'name email role')
      .populate('brandId', 'name color')
      .lean();

    // All brands
    const brands = await Brand.find({ isActive: true }).lean();

    // Overall stats
    const stats = {
      total: allTasks.length,
      live: allTasks.filter((t) => t.status === 'live').length,
      approved: allTasks.filter((t) => t.status === 'approved').length,
      rejected: allTasks.filter((t) => t.revisionCount > 0).length,
      pending: allTasks.filter((t) => !['live', 'approved'].includes(t.status)).length,
      avgRevisions:
        allTasks.length > 0
          ? (allTasks.reduce((sum, t) => sum + (t.revisionCount || 0), 0) / allTasks.length).toFixed(2)
          : 0,
    };

    // Per brand breakdown
    const brandStats = brands.map((brand) => {
      const brandTasks = allTasks.filter(
        (t) => t.brandId?._id?.toString() === brand._id.toString()
      );
      return {
        _id: brand._id,
        name: brand.name,
        color: brand.color,
        total: brandTasks.length,
        live: brandTasks.filter((t) => t.status === 'live').length,
        pending: brandTasks.filter((t) => !['live', 'approved'].includes(t.status)).length,
        rejected: brandTasks.filter((t) => t.revisionCount > 0).length,
        avgRevisions:
          brandTasks.length > 0
            ? (
                brandTasks.reduce((sum, t) => sum + (t.revisionCount || 0), 0) /
                brandTasks.length
              ).toFixed(2)
            : 0,
      };
    }).filter((b) => b.total > 0);

    // Per user performance
    const userMap = new Map();
    allTasks.forEach((task) => {
      (task.assignees || []).forEach((user) => {
        const uid = user._id.toString();
        if (!userMap.has(uid)) {
          userMap.set(uid, {
            _id: uid,
            name: user.name,
            email: user.email,
            role: user.role,
            assigned: 0,
            completed: 0,
            totalRevisions: 0,
          });
        }
        const u = userMap.get(uid);
        u.assigned += 1;
        if (task.status === 'live') u.completed += 1;
        u.totalRevisions += task.revisionCount || 0;
      });
    });

    const userStats = [...userMap.values()].sort((a, b) => b.completed - a.completed);

    // Status breakdown
    const statusBreakdown = {
      copy_wip: allTasks.filter((t) => t.status === 'copy_wip').length,
      design_wip: allTasks.filter((t) => t.status === 'design_wip').length,
      internal_review: allTasks.filter((t) => t.status === 'internal_review').length,
      sent_to_client: allTasks.filter((t) => t.status === 'sent_to_client').length,
      approved: allTasks.filter((t) => t.status === 'approved').length,
      rejected: allTasks.filter((t) => t.status === 'rejected').length,
      live: allTasks.filter((t) => t.status === 'live').length,
    };

    return NextResponse.json({
      period,
      periodStart,
      periodEnd,
      stats,
      brandStats,
      userStats,
      statusBreakdown,
    });
  } catch (err) {
    console.error('GET /api/analytics error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}