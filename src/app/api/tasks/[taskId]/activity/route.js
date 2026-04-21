import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import ActivityLog from '@/lib/db/models/ActivityLog';

const ACTION_LABELS = {
  status_changed: 'moved task to',
  comment_added: 'commented on task',
  task_created: 'created task',
  task_assigned: 'assigned task to',
  task_rejected: 'rejected task',
  task_approved: 'approved task',
  task_live: 'marked task as live',
  task_edited: 'edited task',
};

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { taskId } = await params;

    const logs = await ActivityLog.find({ entityId: taskId, entityType: 'task' })
      .populate('performedBy', 'name email role avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ logs });
  } catch (err) {
    console.error('GET /activity error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}