// src/app/api/brands/[brandId]/members/route.js

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import BrandMember from '@/lib/db/models/BrandMember'
import User from '@/lib/db/models/User'
import Notification from '@/lib/db/models/Notification'
import { canAssignMembers } from '@/lib/auth/permissions'

// POST /api/brands/[brandId]/members — assign a user
export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canAssignMembers(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { brandId } = await params
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(userId).lean()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check already a member
    const existing = await BrandMember.findOne({ brandId, userId })
    if (existing) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
    }

    const member = await BrandMember.create({
      brandId,
      userId,
      assignedBy: session.user.id,
    })

    // Create in-app notification
    await Notification.create({
      recipientId: userId,
      type: 'brand_added',
      message: `${session.user.name} added you to a brand`,
      entityType: 'brand',
      entityId: brandId,
      brandId,
    })

    const populated = await BrandMember.findById(member._id)
      .populate('userId', 'name email role isActive')
      .populate('assignedBy', 'name')
      .lean()

    return NextResponse.json({ member: populated }, { status: 201 })
  } catch (error) {
    console.error('POST /api/brands/[brandId]/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { brandId } = await params;

  const members = await BrandMember.find({ brandId })
    .populate("userId", "name email role isActive");

  return NextResponse.json({ members });
}

// DELETE /api/brands/[brandId]/members — remove a user
export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canAssignMembers(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { brandId } = await params
    const { userId } = await req.json()

    await connectDB()

    await BrandMember.findOneAndDelete({ brandId, userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/brands/[brandId]/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}