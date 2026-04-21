// src/app/api/notifications/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Notification from '@/lib/db/models/Notification';

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const filter = { recipientId: session.user.id };
    if (unreadOnly) filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: session.user.id,
      isRead: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}