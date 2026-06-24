// src/app/api/tasks/[taskId]/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Task from '@/lib/db/models/Task';
import Notification from '@/lib/db/models/Notification';
import { canPerformAction } from '@/lib/auth/permissions';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { taskId } = await params;
    await connectDB();

    const task = await Task.findById(taskId)
      .populate('assignees', 'name email role avatar')
      .populate('createdBy', 'name email')
      .lean();

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ task });
  } catch (err) {
    console.error('GET /tasks/[taskId] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canPerformAction(session.user.role, 'create_tasks')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { taskId } = await params;
    await connectDB();

    const body = await request.json();
    const {
      title,
      description,
      assignees,
      priority,
      internalDeadline,
      externalDeadline,
    } = body;

    const task = await Task.findById(taskId);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    if (task.status === 'live') {
      return NextResponse.json({ error: 'Cannot edit a closed (live) task' }, { status: 400 });
    }

    // Track newly added assignees to notify them
    const prevAssignees = task.assignees.map((a) => a.toString());

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return NextResponse.json({ error: 'title must be a non-empty string' }, { status: 400 });
      }
      task.title = title.trim();
    }
    if (description !== undefined) {
      if (description !== null && typeof description !== 'string') {
        return NextResponse.json({ error: 'description must be a string' }, { status: 400 });
      }
      task.description = description?.trim() || '';
    }
    if (assignees !== undefined)        task.assignees        = assignees;
    if (priority !== undefined)         task.priority         = priority;
    if (internalDeadline !== undefined) task.internalDeadline = internalDeadline || null;
    if (externalDeadline !== undefined) task.externalDeadline = externalDeadline || null;

    await task.save();

    // Notify newly added assignees
    if (assignees !== undefined) {
      const newAssignees = assignees.filter(
        (id) => !prevAssignees.includes(id) && id !== session.user.id
      );
      if (newAssignees.length > 0) {
        await Notification.insertMany(
          newAssignees.map((recipientId) => ({
            recipientId,
            type:       'task_assigned',
            message:    `You were assigned to task: ${task.title}`,
            entityType: 'task',
            entityId:   task._id,
            brandId:    task.brandId,
          }))
        );
      }
    }

    const updated = await Task.findById(taskId)
      .populate('assignees', 'name email role avatar')
      .populate('createdBy', 'name email')
      .lean();

    return NextResponse.json({ task: updated });
  } catch (err) {
    console.error('PATCH /tasks/[taskId] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canPerformAction(session.user.role, 'create_tasks')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { taskId } = await params;
    await connectDB();

    const task = await Task.findByIdAndDelete(taskId);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /tasks/[taskId] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}