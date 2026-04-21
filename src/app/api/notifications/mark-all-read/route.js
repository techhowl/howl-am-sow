// src/app/api/notifications/mark-all-read/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Notification from '@/lib/db/models/Notification';

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    await Notification.updateMany(
      { recipientId: session.user.id, isRead: false },
      { isRead: true }
    );

    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('PATCH /api/notifications/mark-all-read error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}