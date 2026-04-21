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

    const isAdminOrAM = ['admin', 'account_manager'].includes(session.user.role);

    let brandIds;

    if (isAdminOrAM) {
      // Admin/AM see all brands
      const brands = await Brand.find({ isActive: true }).select('_id').lean();
      brandIds = brands.map((b) => b._id);
    } else {
      // Other roles see only brands they are members of
      const memberships = await BrandMember.find({ userId: session.user.id }).select('brandId').lean();
      brandIds = memberships.map((m) => m.brandId);
    }

    if (brandIds.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    // Fetch all non-live tasks that have at least one deadline
    const tasks = await Task.find({
      brandId: { $in: brandIds },
      status: { $ne: 'live' },
      $or: [
        { internalDeadline: { $exists: true, $ne: null } },
        { externalDeadline: { $exists: true, $ne: null } },
      ],
    })
      .populate('brandId', 'name color')
      .populate('assignees', 'name email role')
      .populate('deliverableId', 'name type')
      .sort({ internalDeadline: 1, externalDeadline: 1 })
      .lean();

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('GET /api/timeline error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}