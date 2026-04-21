// src/app/api/brands/route.js

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Brand from '@/lib/db/models/Brand'
import BrandMember from '@/lib/db/models/BrandMember'
import { canManageBrands } from '@/lib/auth/permissions'

// GET /api/brands — list brands the user has access to
export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    let brands

    // Admin and AM see all brands
    if (['admin', 'account_manager'].includes(session.user.role)) {
      brands = await Brand.find({ isActive: true })
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email')
        .lean()
    } else {
      // Others only see brands they are assigned to
      const memberships = await BrandMember.find({
        userId: session.user.id,
      }).lean()

      const brandIds = memberships.map((m) => m.brandId)

      brands = await Brand.find({ _id: { $in: brandIds }, isActive: true })
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email')
        .lean()
    }

    // Attach member count to each brand
    const brandIds = brands.map((b) => b._id)
    const memberCounts = await BrandMember.aggregate([
      { $match: { brandId: { $in: brandIds } } },
      { $group: { _id: '$brandId', count: { $sum: 1 } } },
    ])

    const countMap = {}
    memberCounts.forEach((m) => {
      countMap[m._id.toString()] = m.count
    })

    const brandsWithCount = brands.map((b) => ({
      ...b,
      memberCount: countMap[b._id.toString()] || 0,
    }))

    return NextResponse.json({ brands: brandsWithCount })
  } catch (error) {
    console.error('GET /api/brands error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/brands — create a brand
export async function POST(req) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canManageBrands(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, color, customDeliverableTypes } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 })
    }

    await connectDB()

    const existing = await Brand.findOne({ name: name.trim(), isActive: true })
    if (existing) {
      return NextResponse.json({ error: 'A brand with this name already exists' }, { status: 409 })
    }

    const brand = await Brand.create({
      name: name.trim(),
      color: color || '#4f46e5',
      customDeliverableTypes: customDeliverableTypes || [],
      createdBy: session.user.id,
      isActive: true,
    })

    // Auto-assign the creator as a member
    await BrandMember.create({
      brandId: brand._id,
      userId: session.user.id,
      assignedBy: session.user.id,
    })

    return NextResponse.json({ brand }, { status: 201 })
  } catch (error) {
    console.error('POST /api/brands error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}