import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Comment from '@/lib/db/models/Comment';

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { commentId } = await params;

    const comment = await Comment.findById(commentId);
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    // Only author or admin can delete
    const isAuthor = comment.authorId.toString() === session.user.id;
    const isAdmin = ['superadmin', 'admin'].includes(session.user.role);
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Comment.findByIdAndDelete(commentId);
    return NextResponse.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('DELETE /comments/[commentId] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { commentId } = await params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    // Only author can edit
    if (comment.authorId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    await comment.save();

    const populated = await Comment.findById(commentId)
      .populate('authorId', 'name email role avatar')
      .lean();

    return NextResponse.json({ comment: populated });
  } catch (err) {
    console.error('PATCH /comments/[commentId] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}