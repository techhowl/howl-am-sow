// src/app/api/notifications/[notificationId]/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Notification from '@/lib/db/models/Notification';

export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { notificationId } = await params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: session.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ notification });
  } catch (err) {
    console.error('PATCH /api/notifications/[id] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}