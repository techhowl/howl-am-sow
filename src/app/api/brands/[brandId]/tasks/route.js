// src/app/api/brands/[brandId]/tasks/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Task from '@/lib/db/models/Task';
import BrandMember from '@/lib/db/models/BrandMember';
import Notification from '@/lib/db/models/Notification';
import { canPerformAction, isManagement } from '@/lib/auth/permissions';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { brandId } = await params;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status   = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignee = searchParams.get('assignee');

    const isAdminOrAM = isManagement(session.user.role);
    const filter = { brandId };
    if (status)   filter.status    = status;
    if (priority) filter.priority  = priority;

    // Non-admin/AM users only see tasks assigned to them
    if (!isAdminOrAM) {
      filter.assignees = session.user.id;
    } else if (assignee) {
      // Admin/AM can filter by specific assignee
      filter.assignees = assignee;
    }

    const tasks = await Task.find(filter)
      .populate('assignees', 'name email role avatar')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('GET /tasks error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canPerformAction(session.user.role, 'create_tasks')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { brandId } = await params;
    await connectDB();
    const body = await request.json();

    // NOTE: `type` is now destructured from the body — previously omitted,
    // which caused every task to silently fall back to the schema default 'Static'.
    const {
      title,
      description,
      type,
      assignees        = [],
      priority         = 'medium',
      copyRequired     = true,
      videoRequired    = false,
      designRequired   = true,
      internalDeadline,
      externalDeadline,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!type?.trim()) {
      return NextResponse.json({ error: 'Content type is required' }, { status: 400 });
    }

    // Initial status follows the new workflow order: copy → design → video → sent_to_client
    let initialStatus = 'sent_to_client';
    if (copyRequired)        initialStatus = 'copy_wip';
    else if (designRequired) initialStatus = 'design_wip';
    else if (videoRequired)  initialStatus = 'video_wip';

    const task = await Task.create({
      brandId,
      title:            title.trim(),
      description:      description?.trim() || '',
      type:             type.trim(),
      assignees,
      priority,
      status:           initialStatus,
      copyRequired,
      videoRequired,
      designRequired,
      internalDeadline: internalDeadline || null,
      externalDeadline: externalDeadline || null,
      revisionCount:    0,
      createdBy:        session.user.id,
    });

    // Notify assignees
    if (assignees.length > 0) {
      const notifications = assignees
        .filter((id) => id !== session.user.id)
        .map((recipientId) => ({
          recipientId,
          type:       'task_assigned',
          message:    `You were assigned to "${task.title}"`,
          entityType: 'task',
          entityId:   task._id,
          brandId,
        }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name email role avatar')
      .populate('createdBy', 'name email')
      .lean();

    return NextResponse.json({ task: populated }, { status: 201 });
  } catch (err) {
    console.error('POST /tasks error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}