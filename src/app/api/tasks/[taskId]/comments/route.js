import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Comment from '@/lib/db/models/Comment';
import Task from '@/lib/db/models/Task';
import Notification from '@/lib/db/models/Notification';
import ActivityLog from '@/lib/db/models/ActivityLog';

// Parse @mentions from comment content — returns array of matched names
function parseMentions(content) {
  const regex = /@([a-zA-Z0-9_ ]+?)(?=\s|$|[^a-zA-Z0-9_ ])/g;
  const matches = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    matches.push(m[1].trim());
  }
  return matches;
}

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { taskId } = await params;

    const comments = await Comment.find({ taskId })
      .populate('authorId', 'name email role avatar')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ comments });
  } catch (err) {
    console.error('GET /comments error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { taskId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    const task = await Task.findById(taskId).populate('assignees', '_id name');
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // Parse @mentions from content
    const mentionedNames = parseMentions(content);

    // Match mentioned names to assignees or task creator
    const User = (await import('@/lib/db/models/User')).default;
    let mentionedUserIds = [];
    if (mentionedNames.length > 0) {
      const mentionedUsers = await User.find({
        name: { $in: mentionedNames.map((n) => new RegExp(`^${n}$`, 'i')) },
      }).select('_id');
      mentionedUserIds = mentionedUsers.map((u) => u._id);
    }

    const comment = await Comment.create({
      taskId,
      content: content.trim(),
      authorId: session.user.id,
      mentions: mentionedUserIds,
      isEdited: false,
    });

    // Activity log
    await ActivityLog.create({
      entityType: 'task',
      entityId: taskId,
      brandId: task.brandId,
      action: 'comment_added',
      metadata: { commentId: comment._id, preview: content.trim().slice(0, 100) },
      performedBy: session.user.id,
    });

    // Notify assignees (except commenter)
    const assigneeIds = task.assignees.map((a) => a._id.toString());
    const commenterId = session.user.id;

    const notifyIds = new Set([
      ...assigneeIds,
      task.createdBy?.toString(),
    ].filter((id) => id && id !== commenterId));

    if (notifyIds.size > 0) {
      await Notification.insertMany(
        [...notifyIds].map((recipientId) => ({
          recipientId,
          type: 'comment_added',
          message: `New comment on task "${task.title}"`,
          entityType: 'task',
          entityId: taskId,
          brandId: task.brandId,
        }))
      );
    }

    // Notify mentioned users (separate mention notification)
    const mentionNotifyIds = mentionedUserIds
      .map((id) => id.toString())
      .filter((id) => id !== commenterId && !notifyIds.has(id));

    if (mentionNotifyIds.length > 0) {
      await Notification.insertMany(
        mentionNotifyIds.map((recipientId) => ({
          recipientId,
          type: 'mentioned',
          message: `You were mentioned in a comment on task "${task.title}"`,
          entityType: 'task',
          entityId: taskId,
          brandId: task.brandId,
        }))
      );
    }

    const populated = await Comment.findById(comment._id)
      .populate('authorId', 'name email role avatar')
      .lean();

    return NextResponse.json({ comment: populated }, { status: 201 });
  } catch (err) {
    console.error('POST /comments error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}