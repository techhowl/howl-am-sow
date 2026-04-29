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
    const period    = searchParams.get('period') || 'month';
    const dateParam = searchParams.get('date')   || new Date().toISOString();
    const refDate   = new Date(dateParam);

    let periodStart, periodEnd;
    if (period === 'week') {
      periodStart = startOfWeek(refDate, { weekStartsOn: 1 });
      periodEnd   = endOfWeek(refDate,   { weekStartsOn: 1 });
    } else {
      periodStart = startOfMonth(refDate);
      periodEnd   = endOfMonth(refDate);
    }

    const brands = await Brand.find({ isActive: true }).lean();

    // For each brand, compute SOW progress
    const brandStats = await Promise.all(
      brands.map(async (brand) => {
        const tasks = await Task.find({
          brandId:   brand._id,
          createdAt: { $gte: periodStart, $lte: periodEnd },
        }).lean();

        const achieved = tasks.filter((t) => ['approved', 'live'].includes(t.status));
        const pending  = tasks.filter((t) => !['approved', 'live', 'rejected'].includes(t.status));
        const rejected = tasks.filter((t) => t.status === 'rejected');

        const percentComplete = tasks.length > 0
          ? Math.round((achieved.length / tasks.length) * 100)
          : 0;

        // Priority breakdown for this brand
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
          _id:             brand._id,
          name:            brand.name,
          color:           brand.color,
          sowProgress: {
            total:           tasks.length,
            achieved:        achieved.length,
            pending:         pending.length,
            rejected:        rejected.length,
            percentComplete,
          },
          prioritySOW,
        };
      })
    );

    // Overall totals across all brands
    const allTasks = await Task.find({
      createdAt: { $gte: periodStart, $lte: periodEnd },
    }).lean();

    const overallSOW = {
      total:    allTasks.length,
      achieved: allTasks.filter((t) => ['approved', 'live'].includes(t.status)).length,
      pending:  allTasks.filter((t) => !['approved', 'live', 'rejected'].includes(t.status)).length,
      rejected: allTasks.filter((t) => t.status === 'rejected').length,
      percentComplete: allTasks.length > 0
        ? Math.round(
            (allTasks.filter((t) => ['approved', 'live'].includes(t.status)).length / allTasks.length) * 100
          )
        : 0,
    };

    return NextResponse.json({
      period, periodStart, periodEnd,
      overallSOW,
      brandStats: brandStats.sort((a, b) => b.sowProgress.total - a.sowProgress.total),
    });
  } catch (err) {
    console.error('GET /api/analytics error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}