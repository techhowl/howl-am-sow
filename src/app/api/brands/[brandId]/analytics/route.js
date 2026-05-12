// src/app/api/brands/[brandId]/analytics/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Task from '@/lib/db/models/Task';
import Brand from '@/lib/db/models/Brand';
import SOW from '@/lib/db/models/SOW';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'account_manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { brandId }   = await params;
    const { searchParams } = new URL(req.url);
    const dateParam     = searchParams.get('date') || new Date().toISOString();
    const refDate       = new Date(dateParam);
    const month         = format(refDate, 'yyyy-MM');
    const periodStart   = startOfMonth(refDate);
    const periodEnd     = endOfMonth(refDate);

    const brand = await Brand.findById(brandId).lean();
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    // Get SOW targets for this month
    const sow = await SOW.findOne({ brandId, month }).lean();

    // Get all tasks created this month
    const tasks = await Task.find({
      brandId,
      createdAt: { $gte: periodStart, $lte: periodEnd },
    }).populate('assignees', 'name email role').lean();

    // ── SOW by content type ───────────────────────────────────────────────
    // Build a map of all types that appear in either SOW targets or tasks
    const typeSet = new Set([
      ...(sow?.items || []).map((i) => i.type),
      ...tasks.map((t) => t.type).filter(Boolean),
    ]);

    const sowByType = [...typeSet].map((type) => {
      const target   = sow?.items?.find((i) => i.type === type)?.target ?? null
      const typeTasks = tasks.filter((t) => t.type === type)
      const achieved  = typeTasks.filter((t) => ['approved', 'live'].includes(t.status)).length
      const pending   = typeTasks.filter((t) => !['approved', 'live', 'rejected'].includes(t.status)).length
      const rejected  = typeTasks.filter((t) => t.status === 'rejected').length
      const total     = typeTasks.length

      // % based on target if set, otherwise based on total tasks
      const denominator = target !== null ? target : total
      const percent     = denominator > 0 ? Math.round((achieved / denominator) * 100) : 0

      return {
        type,
        target,          // null if no SOW defined for this type
        total,           // tasks created
        achieved,
        pending,
        rejected,
        percentComplete: Math.min(percent, 100), // cap at 100%
        overDelivered:   target !== null && achieved > target,
        surplus:         target !== null ? Math.max(0, achieved - target) : 0,
      }
    }).sort((a, b) => {
      // Sort: types with targets first, then alphabetical
      if (a.target !== null && b.target === null) return -1
      if (a.target === null && b.target !== null) return 1
      return a.type.localeCompare(b.type)
    })

    // ── Overall SOW summary ───────────────────────────────────────────────
    const totalTarget  = sow?.items?.reduce((s, i) => s + i.target, 0) ?? null
    const totalAchieved = tasks.filter((t) => ['approved', 'live'].includes(t.status)).length
    const totalPending  = tasks.filter((t) => !['approved', 'live', 'rejected'].includes(t.status)).length
    const totalRejected = tasks.filter((t) => t.status === 'rejected').length

    const overallPercent = totalTarget
      ? Math.min(Math.round((totalAchieved / totalTarget) * 100), 100)
      : tasks.length > 0
        ? Math.round((totalAchieved / tasks.length) * 100)
        : 0

    const sowSummary = {
      month,
      totalTarget,
      totalTasks:  tasks.length,
      totalAchieved,
      totalPending,
      totalRejected,
      percentComplete: overallPercent,
      hasSowDefined: !!sow,
      carryOvers:    sow?.carryOvers || [],
    }

    // ── Team performance ──────────────────────────────────────────────────
    const userMap = new Map();
    tasks.forEach((task) => {
      (task.assignees || []).forEach((user) => {
        const uid = user._id.toString();
        if (!userMap.has(uid)) {
          userMap.set(uid, { _id: uid, name: user.name, email: user.email, role: user.role, assigned: 0, completed: 0, totalRevisions: 0 });
        }
        const u = userMap.get(uid);
        u.assigned += 1;
        if (['approved', 'live'].includes(task.status)) u.completed += 1;
        u.totalRevisions += task.revisionCount || 0;
      });
    });
    const userStats = [...userMap.values()].sort((a, b) => b.completed - a.completed);

    // ── CSV export list ───────────────────────────────────────────────────
    const taskList = tasks.map((t) => ({
      title:    t.title,
      type:     t.type || '',
      status:   t.status,
      achieved: ['approved', 'live'].includes(t.status) ? 'Yes' : 'No',
      priority: t.priority,
      revisions:t.revisionCount || 0,
      assignees:t.assignees?.map((a) => a.name).join(', ') || '',
      internalDeadline: t.internalDeadline ? new Date(t.internalDeadline).toISOString().split('T')[0] : '',
      externalDeadline: t.externalDeadline ? new Date(t.externalDeadline).toISOString().split('T')[0] : '',
      createdAt:new Date(t.createdAt).toISOString().split('T')[0],
    }));

    return NextResponse.json({
      brand, month, periodStart, periodEnd,
      sowSummary, sowByType,
      userStats, taskList,
    });
  } catch (err) {
    console.error('GET /api/brands/[brandId]/analytics error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}