// src/app/api/users/[userId]/route.js

import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'
import { canCreateUsers } from '@/lib/auth/permissions'
import { NextResponse } from 'next/server'

// PATCH /api/users/[userId] — update name or isActive
export async function PATCH(req, { params }) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canCreateUsers(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params
    const body = await req.json()

    // Only allow safe fields to be updated here
    const allowedUpdates = {}
    if (typeof body.isActive === 'boolean') {
      allowedUpdates.isActive = body.isActive
    }
    if (body.name) {
      allowedUpdates.name = body.name.trim()
    }

    // Prevent deactivating yourself
    if (userId === session.user.id && body.isActive === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true }
    ).select('-passwordHash')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('PATCH /api/users/[userId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}