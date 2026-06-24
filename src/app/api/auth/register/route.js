// src/app/api/auth/register/route.js
// Open self-signup. Creates a no-access 'user' account pending superadmin approval.

import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      )
    }

    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    await connectDB()

    // Reject duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // role 'user' = no access; superadmin promotes to a real RBAC role later.
    // isActive true so they can log in and see the "pending access" screen.
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'user',
      isActive: true,
      createdBy: null,
    })

    return NextResponse.json(
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/auth/register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
