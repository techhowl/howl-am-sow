// src/app/api/brands/[brandId]/analytics/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Task from '@/lib/db/models/Task';
import Brand from '@/lib/db/models/Brand';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'account_manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { brandId } = await params;
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

    const brand = await Brand.findById(brandId).lean();
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    const tasks = await Task.find({
      brandId,
      createdAt: { $gte: periodStart, $lte: periodEnd },
    })
      .populate('assignees', 'name email role')
      .lean();

    // ── SOW Progress ──────────────────────────────────────────────────────
    // SOW = every task created this period by the AM
    // Achieved = approved + live
    const achievedTasks = tasks.filter((t) => ['approved', 'live'].includes(t.status));
    const pendingTasks  = tasks.filter((t) => !['approved', 'live', 'rejected'].includes(t.status));
    const rejectedTasks = tasks.filter((t) => t.status === 'rejected');

    const sowProgress = {
      total:           tasks.length,
      achieved:        achievedTasks.length,
      pending:         pendingTasks.length,
      rejected:        rejectedTasks.length,
      percentComplete: tasks.length > 0
        ? Math.round((achievedTasks.length / tasks.length) * 100)
        : 0,
    };

    // ── SOW breakdown by priority ─────────────────────────────────────────
    const prioritySOW = ['high', 'medium', 'low'].map((p) => {
      const pt = tasks.filter((t) => t.priority === p);
      const pa = pt.filter((t) => ['approved', 'live'].includes(t.status));
      return {
        priority:        p,
        total:           pt.length,
        achieved:        pa.length,
        pending:         pt.filter((t) => !['approved', 'live', 'rejected'].includes(t.status)).length,
        percentComplete: pt.length > 0 ? Math.round((pa.length / pt.length) * 100) : 0,
      };
    }).filter((p) => p.total > 0);

    // ── Task-level SOW list ───────────────────────────────────────────────
    const sowTaskList = tasks.map((t) => ({
      _id:             t._id,
      title:           t.title,
      priority:        t.priority,
      status:          t.status,
      achieved:        ['approved', 'live'].includes(t.status),
      revisionCount:   t.revisionCount || 0,
      assignees:       t.assignees?.map((a) => a.name).join(', ') || '—',
      internalDeadline: t.internalDeadline
        ? new Date(t.internalDeadline).toISOString().split('T')[0] : '',
      externalDeadline: t.externalDeadline
        ? new Date(t.externalDeadline).toISOString().split('T')[0] : '',
      createdAt:       new Date(t.createdAt).toISOString().split('T')[0],
    }));

    // ── Overall stats ─────────────────────────────────────────────────────
    const stats = {
      total:        tasks.length,
      live:         tasks.filter((t) => t.status === 'live').length,
      approved:     tasks.filter((t) => t.status === 'approved').length,
      pending:      pendingTasks.length,
      rejected:     tasks.filter((t) => t.revisionCount > 0).length,
      avgRevisions: tasks.length > 0
        ? (tasks.reduce((s, t) => s + (t.revisionCount || 0), 0) / tasks.length).toFixed(2)
        : 0,
    };

    // ── Status breakdown ──────────────────────────────────────────────────
    const statusBreakdown = {
      copy_wip:        tasks.filter((t) => t.status === 'copy_wip').length,
      video_wip:       tasks.filter((t) => t.status === 'video_wip').length,
      design_wip:      tasks.filter((t) => t.status === 'design_wip').length,
      internal_review: tasks.filter((t) => t.status === 'internal_review').length,
      sent_to_client:  tasks.filter((t) => t.status === 'sent_to_client').length,
      approved:        tasks.filter((t) => t.status === 'approved').length,
      rejected:        tasks.filter((t) => t.status === 'rejected').length,
      live:            tasks.filter((t) => t.status === 'live').length,
    };

    // ── Per-user performance ──────────────────────────────────────────────
    const userMap = new Map();
    tasks.forEach((task) => {
      (task.assignees || []).forEach((user) => {
        const uid = user._id.toString();
        if (!userMap.has(uid)) {
          userMap.set(uid, {
            _id: uid, name: user.name, email: user.email, role: user.role,
            assigned: 0, completed: 0, totalRevisions: 0,
          });
        }
        const u = userMap.get(uid);
        u.assigned += 1;
        if (['approved', 'live'].includes(task.status)) u.completed += 1;
        u.totalRevisions += task.revisionCount || 0;
      });
    });
    const userStats = [...userMap.values()].sort((a, b) => b.completed - a.completed);

    // ── Priority breakdown ────────────────────────────────────────────────
    const priorityBreakdown = {
      high:   tasks.filter((t) => t.priority === 'high').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      low:    tasks.filter((t) => t.priority === 'low').length,
    };

    // ── CSV task list ─────────────────────────────────────────────────────
    const taskList = tasks.map((t) => ({
      title:           t.title,
      status:          t.status,
      achieved:        ['approved', 'live'].includes(t.status) ? 'Yes' : 'No',
      priority:        t.priority,
      revisionCount:   t.revisionCount || 0,
      assignees:       t.assignees?.map((a) => a.name).join(', ') || '',
      internalDeadline: t.internalDeadline
        ? new Date(t.internalDeadline).toISOString().split('T')[0] : '',
      externalDeadline: t.externalDeadline
        ? new Date(t.externalDeadline).toISOString().split('T')[0] : '',
      createdAt:       new Date(t.createdAt).toISOString().split('T')[0],
    }));

    return NextResponse.json({
      brand, period, periodStart, periodEnd,
      sowProgress, prioritySOW, sowTaskList,
      stats, statusBreakdown, priorityBreakdown, userStats, taskList,
    });
  } catch (err) {
    console.error('GET /api/brands/[brandId]/analytics error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}