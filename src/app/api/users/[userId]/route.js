// src/app/api/users/[userId]/route.js

import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'
import { canManageRoles, RBAC_ROLES } from '@/lib/auth/permissions'
import { NextResponse } from 'next/server'

// Roles a superadmin may assign via the UI ('user' = revoke access; never 'superadmin')
const ASSIGNABLE_ROLES = [...RBAC_ROLES, 'user']

// PATCH /api/users/[userId] — update name, isActive, or role
export async function PATCH(req, { params }) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // User administration is superadmin-only. The /users page is already
    // superadmin-only in the UI; this closes the matching hole in the API,
    // where any management-tier role (including every AM tier) could
    // previously rename or deactivate anyone — a superadmin included.
    if (!canManageRoles(session.user.role)) {
      return NextResponse.json(
        { error: 'Only a superadmin can manage users' },
        { status: 403 }
      )
    }

    const { userId } = await params
    const body = await req.json()

    await connectDB()

    const target = await User.findById(userId).select('role isActive').lean()
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only allow safe fields to be updated here
    const allowedUpdates = {}
    if (typeof body.isActive === 'boolean') {
      allowedUpdates.isActive = body.isActive
    }
    if (body.name) {
      allowedUpdates.name = body.name.trim()
    }

    // Role changes — this is how access is granted/revoked
    if (body.role !== undefined) {
      if (!ASSIGNABLE_ROLES.includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      if (userId === session.user.id) {
        return NextResponse.json(
          { error: 'You cannot change your own role' },
          { status: 400 }
        )
      }
      // A superadmin cannot be demoted through the API — superadmin status is
      // granted and removed server-side only (npm run set:superadmin).
      if (target.role === 'superadmin') {
        return NextResponse.json(
          { error: 'A superadmin role can only be changed from the server script' },
          { status: 403 }
        )
      }
      allowedUpdates.role = body.role
    }

    // Prevent deactivating yourself
    if (userId === session.user.id && body.isActive === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Never allow the last active superadmin to be deactivated — that would
    // lock everyone out of user management permanently.
    if (allowedUpdates.isActive === false && target.role === 'superadmin') {
      const activeSuperadmins = await User.countDocuments({
        role: 'superadmin',
        isActive: true,
      })
      if (activeSuperadmins <= 1) {
        return NextResponse.json(
          { error: 'Cannot deactivate the last active superadmin' },
          { status: 400 }
        )
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

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
