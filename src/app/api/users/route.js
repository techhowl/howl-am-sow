// src/app/api/users/route.js

import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'
import { getCreatableRoles, canCreateUsers } from '@/lib/auth/permissions'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

// GET /api/users — list all users (admin + AM only)
export async function GET(req) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canCreateUsers(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const users = await User.find({})
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ users })
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/users — create a new user
export async function POST(req) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canCreateUsers(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, password, role } = body

    // Basic validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password and role are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if creator is allowed to assign this role
    const allowedRoles = getCreatableRoles(session.user.role)
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'You are not allowed to assign this role' },
        { status: 403 }
      )
    }

    await connectDB()

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      createdBy: session.user.id,
      isActive: true,
    })

    return NextResponse.json(
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}