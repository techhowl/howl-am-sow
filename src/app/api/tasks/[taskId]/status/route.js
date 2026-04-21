// src/app/api/tasks/[taskId]/status/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Task from '@/lib/db/models/Task';
import RejectionLog from '@/lib/db/models/RejectionLog';
import Notification from '@/lib/db/models/Notification';
import ActivityLog from '@/lib/db/models/ActivityLog';
import { canPerformAction } from '@/lib/auth/permissions';
import { getValidTransitions } from '@/lib/workflow/transitions';

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { taskId } = await params;
    await connectDB();

    const body = await request.json();
    const { status: newStatus, routeTo, rejectionReason } = body;

    if (!newStatus) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const task = await Task.findById(taskId).populate('assignees', '_id name');
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    if (task.status === 'live') {
      return NextResponse.json(
        { error: 'Task is closed — no further transitions allowed' },
        { status: 400 }
      );
    }

    // Server-side transition validation
    const validNext = getValidTransitions(task.status);
    if (!validNext.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid transition: ${task.status} → ${newStatus}` },
        { status: 400 }
      );
    }

    // ── REJECTION ──────────────────────────────────────────────────────────
    if (newStatus === 'rejected') {
      if (!canPerformAction(session.user.role, 'route_rejection')) {
        return NextResponse.json(
          { error: 'Only Admin or Account Manager can reject tasks' },
          { status: 403 }
        );
      }
      if (!routeTo || !['copy_wip', 'design_wip'].includes(routeTo)) {
        return NextResponse.json(
          { error: 'routeTo must be copy_wip or design_wip' },
          { status: 400 }
        );
      }

      const prevStatus = task.status; // capture BEFORE mutation

      await RejectionLog.create({
        taskId: task._id,
        routedBackTo: routeTo,
        reason: rejectionReason?.trim() || '',
        rejectedBy: session.user.id,
        rejectedAt: new Date(),
      });

      // Increment revision and route directly — skip "rejected" column
      task.revisionCount = (task.revisionCount || 0) + 1;
      task.status = routeTo;
      await task.save();

      await ActivityLog.create({
        entityType: 'task',
        entityId: taskId,
        brandId: task.brandId,
        action: 'task_rejected',
        metadata: {
          prevStatus,
          routedTo: routeTo,
          reason: rejectionReason?.trim() || '',
        },
        performedBy: session.user.id,
      });

      // Notify assignees
      const recipientIds = task.assignees
        .map((a) => a._id.toString())
        .filter((id) => id !== session.user.id);

      if (recipientIds.length > 0) {
        await Notification.insertMany(
          recipientIds.map((recipientId) => ({
            recipientId,
            type: 'task_rejected',
            message: `Task "${task.title}" was rejected${rejectionReason ? ': ' + rejectionReason : ''} and routed back to ${routeTo.replace(/_/g, ' ')}`,
            entityType: 'task',
            entityId: task._id,
            brandId: task.brandId,
          }))
        );
      }

      const updated = await Task.findById(taskId)
        .populate('assignees', 'name email role avatar')
        .populate('deliverableId', 'name type')
        .populate('createdBy', 'name email')
        .lean();

      return NextResponse.json({ task: updated });
    }

    // ── ROUTING FROM REJECTED requires AM/Admin ────────────────────────────
    if (task.status === 'rejected') {
      if (!canPerformAction(session.user.role, 'route_rejection')) {
        return NextResponse.json(
          { error: 'Only Admin or Account Manager can route rejected tasks' },
          { status: 403 }
        );
      }
    }

    // ── NORMAL TRANSITION ──────────────────────────────────────────────────
    const prevStatus = task.status;
    task.status = newStatus;

    if (newStatus === 'live') {
      task.closedAt = new Date();
    }

    await task.save();

    // Activity log
    await ActivityLog.create({
      entityType: 'task',
      entityId: taskId,
      brandId: task.brandId,
      action:
        newStatus === 'live'
          ? 'task_live'
          : newStatus === 'approved'
            ? 'task_approved'
            : 'status_changed',
      metadata: { prevStatus, newStatus },
      performedBy: session.user.id,
    });

    // Notify assignees
    const recipientIds = task.assignees
      .map((a) => a._id.toString())
      .filter((id) => id !== session.user.id);

    let notifType = 'status_changed';
    let notifMessage = `Task "${task.title}" moved to ${newStatus.replace(/_/g, ' ')}`;

    if (newStatus === 'approved') {
      notifType = 'task_approved';
      notifMessage = `Task "${task.title}" was approved`;
    } else if (newStatus === 'live') {
      notifType = 'task_live';
      notifMessage = `Task "${task.title}" is now live`;
    }

    if (recipientIds.length > 0) {
      await Notification.insertMany(
        recipientIds.map((recipientId) => ({
          recipientId,
          type: notifType,
          message: notifMessage,
          entityType: 'task',
          entityId: task._id,
          brandId: task.brandId,
        }))
      );
    }

    const updated = await Task.findById(taskId)
      .populate('assignees', 'name email role avatar')
      .populate('deliverableId', 'name type')
      .populate('createdBy', 'name email')
      .lean();

    return NextResponse.json({ task: updated });
  } catch (err) {
    console.error('PATCH /tasks/[taskId]/status error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}