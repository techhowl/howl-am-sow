// src/app/api/brands/route.js
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Brand from '@/lib/db/models/Brand'
import BrandMember from '@/lib/db/models/BrandMember'
import SOW from '@/lib/db/models/SOW'
import { canManageBrands } from '@/lib/auth/permissions'
import { format } from 'date-fns'

// GET — list brands
export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    let brands
    if (['admin', 'account_manager'].includes(session.user.role)) {
      brands = await Brand.find({ isActive: true })
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email')
        .lean()
    } else {
      const memberships = await BrandMember.find({ userId: session.user.id }).lean()
      const brandIds    = memberships.map((m) => m.brandId)
      brands = await Brand.find({ _id: { $in: brandIds }, isActive: true })
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email')
        .lean()
    }

    const brandIds     = brands.map((b) => b._id)
    const memberCounts = await BrandMember.aggregate([
      { $match: { brandId: { $in: brandIds } } },
      { $group: { _id: '$brandId', count: { $sum: 1 } } },
    ])
    const countMap = {}
    memberCounts.forEach((m) => { countMap[m._id.toString()] = m.count })

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

// POST — create a brand with initial SOW + members
export async function POST(req) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!canManageBrands(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, color, sowItems = [], memberIds = [] } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 })
    }

    await connectDB()

    const existing = await Brand.findOne({ name: name.trim(), isActive: true })
    if (existing) {
      return NextResponse.json({ error: 'A brand with this name already exists' }, { status: 409 })
    }

    // Create brand
    const brand = await Brand.create({
      name:      name.trim(),
      color:     color || '#4f46e5',
      createdBy: session.user.id,
      isActive:  true,
    })

    // Auto-assign creator as member
    const memberSet = new Set([session.user.id, ...memberIds])
    await BrandMember.insertMany(
      [...memberSet].map((userId) => ({
        brandId:    brand._id,
        userId,
        assignedBy: session.user.id,
      }))
    )

    // Save initial SOW for current month if AM defined targets
    if (sowItems.length > 0) {
      const currentMonth = format(new Date(), 'yyyy-MM')
      await SOW.create({
        brandId:   brand._id,
        month:     currentMonth,
        items:     sowItems,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
    }

    return NextResponse.json({ brand }, { status: 201 })
  } catch (error) {
    console.error('POST /api/brands error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}