// src/app/api/tasks/[taskId]/status/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Task from '@/lib/db/models/Task';
import RejectionLog from '@/lib/db/models/RejectionLog';
import Notification from '@/lib/db/models/Notification';
import ActivityLog from '@/lib/db/models/ActivityLog';
import { canPerformAction } from '@/lib/auth/permissions';
import { getValidTransitions, BACKWARD_TRANSITIONS } from '@/lib/workflow/transitions';

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { taskId } = await params;
    await connectDB();

    const body = await request.json();
    // status      — the target status
    // routeTo     — only used when manually routing from 'rejected' (copy_wip / video_wip / design_wip)
    // rejectionReason — text when rejecting
    // liveDate    — date string set when moving approved → live
    // direction   — 'forward' | 'backward' | 'direct' (used for logging only)
    const { status: newStatus, routeTo, rejectionReason, liveDate, direction } = body;

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

    // ── MANUAL ROUTE FROM REJECTED ─────────────────────────────────────────
    // This is triggered by the "Route for Revision" action on a rejected task.
    // routeTo must be one of: copy_wip, video_wip, design_wip
    if (task.status === 'rejected' && newStatus !== 'rejected') {
      if (!canPerformAction(session.user.role, 'route_rejection')) {
        return NextResponse.json(
          { error: 'Only Admin or Account Manager can route rejected tasks' },
          { status: 403 }
        );
      }

      const validRoutes = ['copy_wip', 'video_wip', 'design_wip']
      if (!validRoutes.includes(newStatus)) {
        return NextResponse.json(
          { error: 'Can only route rejected tasks to copy_wip, video_wip, or design_wip' },
          { status: 400 }
        );
      }

      const prevStatus = task.status;
      task.status = newStatus;
      await task.save();

      // Close the loop: record where the most recent rejection was routed back to
      await RejectionLog.findOneAndUpdate(
        { taskId, routedBackTo: null },
        { routedBackTo: newStatus, routedBackAt: new Date() },
        { sort: { rejectedAt: -1 } }
      );

      await ActivityLog.create({
        entityType: 'task',
        entityId:   taskId,
        brandId:    task.brandId,
        action:     'status_changed',
        metadata:   { prevStatus, newStatus, direction: 'routed_from_rejected' },
        performedBy: session.user.id,
      });

      const populated = await Task.findById(taskId)
        .populate('assignees', 'name email role avatar')
        .populate('createdBy', 'name email')
        .lean();
      return NextResponse.json({ task: populated });
    }

    // ── REJECTION ──────────────────────────────────────────────────────────
    if (newStatus === 'rejected') {
      if (!canPerformAction(session.user.role, 'route_rejection')) {
        return NextResponse.json(
          { error: 'Only Admin or Account Manager can reject tasks' },
          { status: 403 }
        );
      }

      // Validate transition
      const validNext = getValidTransitions(task.status);
      if (!validNext.includes('rejected')) {
        return NextResponse.json(
          { error: `Cannot reject from status: ${task.status}` },
          { status: 400 }
        );
      }

      const prevStatus = task.status;
      task.revisionCount = (task.revisionCount || 0) + 1;
      task.status = 'rejected';
      await task.save();

      // Log rejection — routedBackTo stays null until AM routes it back
      await RejectionLog.create({
        taskId,
        routedBackTo: null,
        reason:       rejectionReason?.trim() || '',
        rejectedBy:   session.user.id,
        rejectedAt:   new Date(),
      });

      await ActivityLog.create({
        entityType: 'task',
        entityId:   taskId,
        brandId:    task.brandId,
        action:     'task_rejected',
        metadata:   { prevStatus, reason: rejectionReason?.trim() || '' },
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
            type:    'task_rejected',
            message: `Task "${task.title}" was rejected${rejectionReason ? ': ' + rejectionReason : ''}`,
            entityType: 'task',
            entityId:   task._id,
            brandId:    task.brandId,
          }))
        );
      }

      const populated = await Task.findById(taskId)
        .populate('assignees', 'name email role avatar')
        .populate('createdBy', 'name email')
        .lean();
      return NextResponse.json({ task: populated });
    }

    // ── NORMAL TRANSITION ──────────────────────────────────────────────────
    const validNext = getValidTransitions(task.status);
    // Also allow backward transitions
    const backwardTarget = BACKWARD_TRANSITIONS[task.status];

    const isForward  = validNext.includes(newStatus);
    const isBackward = backwardTarget === newStatus;

    if (!isForward && !isBackward) {
      return NextResponse.json(
        { error: `Invalid transition: ${task.status} → ${newStatus}` },
        { status: 400 }
      );
    }

    // Backward requires AM/Admin
    if (isBackward && !canPerformAction(session.user.role, 'route_rejection')) {
      return NextResponse.json(
        { error: 'Only Admin or Account Manager can move tasks backward' },
        { status: 403 }
      );
    }

    const prevStatus = task.status;
    task.status = newStatus;

    // approved → live: set liveDate
    if (newStatus === 'live') {
      task.closedAt = new Date();
      if (liveDate) {
        task.liveDate = new Date(liveDate);
      } else {
        task.liveDate = new Date();
      }
    }

    await task.save();

    // Activity log
    await ActivityLog.create({
      entityType: 'task',
      entityId:   taskId,
      brandId:    task.brandId,
      action:
        newStatus === 'live'     ? 'task_live'     :
        newStatus === 'approved' ? 'task_approved' :
        'status_changed',
      metadata: {
        prevStatus,
        newStatus,
        direction: isBackward ? 'backward' : 'forward',
        liveDate: liveDate || null,
      },
      performedBy: session.user.id,
    });

    // Notify assignees
    const recipientIds = task.assignees
      .map((a) => a._id.toString())
      .filter((id) => id !== session.user.id);

    let notifType    = 'status_changed';
    let notifMessage = `Task "${task.title}" moved to ${newStatus.replace(/_/g, ' ')}`;
    if (newStatus === 'approved') { notifType = 'task_approved'; notifMessage = `Task "${task.title}" was approved`; }
    if (newStatus === 'live')     { notifType = 'task_live';     notifMessage = `Task "${task.title}" is now live`; }

    if (recipientIds.length > 0) {
      await Notification.insertMany(
        recipientIds.map((recipientId) => ({
          recipientId,
          type:    notifType,
          message: notifMessage,
          entityType: 'task',
          entityId:   task._id,
          brandId:    task.brandId,
        }))
      );
    }

    const populated = await Task.findById(taskId)
      .populate('assignees', 'name email role avatar')
      .populate('createdBy', 'name email')
      .lean();
    return NextResponse.json({ task: populated });
  } catch (err) {
    console.error('PATCH /tasks/[taskId]/status error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}