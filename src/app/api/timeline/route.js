// src/app/api/timeline/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Task from '@/lib/db/models/Task';
import BrandMember from '@/lib/db/models/BrandMember';
import Brand from '@/lib/db/models/Brand';

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const isAdminOrAM = ['superadmin', 'admin', 'account_manager'].includes(session.user.role);

    let filter = { status: { $ne: 'live' } };

    if (isAdminOrAM) {
      // Admin/AM see all tasks across all active brands
      const brands   = await Brand.find({ isActive: true }).select('_id').lean();
      const brandIds = brands.map((b) => b._id);
      filter.brandId = { $in: brandIds };
    } else {
      // Employees only see tasks assigned to them in brands they belong to
      const memberships = await BrandMember.find({ userId: session.user.id }).select('brandId').lean();
      const brandIds    = memberships.map((m) => m.brandId);

      if (brandIds.length === 0) {
        return NextResponse.json({ tasks: [] });
      }

      filter.brandId   = { $in: brandIds };
      filter.assignees = session.user.id;
    }

    const tasks = await Task.find(filter)
      .populate('brandId',   'name color')
      .populate('assignees', 'name email role')
      .sort({ internalDeadline: 1, externalDeadline: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('GET /api/timeline error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}