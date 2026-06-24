// src/app/api/brands/[brandId]/route.js

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Brand from '@/lib/db/models/Brand'
import BrandMember from '@/lib/db/models/BrandMember'
import { canManageBrands } from '@/lib/auth/permissions'

// GET /api/brands/[brandId]
export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brandId } = await params
    await connectDB()

    const brand = await Brand.findById(brandId)
      .populate('createdBy', 'name email')
      .lean()

    if (!brand || !brand.isActive) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check access — AM and admin see all, others must be a member
    if (!['superadmin', 'admin', 'account_manager'].includes(session.user.role)) {
      const member = await BrandMember.findOne({
        brandId,
        userId: session.user.id,
      })
      if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get members
    const members = await BrandMember.find({ brandId })
      .populate('userId', 'name email role isActive')
      .populate('assignedBy', 'name')
      .lean()

    return NextResponse.json({ brand, members })
  } catch (error) {
    console.error('GET /api/brands/[brandId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/brands/[brandId]
export async function PATCH(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canManageBrands(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { brandId } = await params
    const body = await req.json()

    const allowed = {}
    if (body.name) allowed.name = body.name.trim()
    if (body.color) allowed.color = body.color
    if (body.customDeliverableTypes) allowed.customDeliverableTypes = body.customDeliverableTypes

    await connectDB()

    const brand = await Brand.findByIdAndUpdate(
      brandId,
      { $set: allowed },
      { new: true }
    )

    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

    return NextResponse.json({ brand })
  } catch (error) {
    console.error('PATCH /api/brands/[brandId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/brands/[brandId] — soft delete
export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['superadmin', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { brandId } = await params
    await connectDB()

    await Brand.findByIdAndUpdate(brandId, { $set: { isActive: false } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/brands/[brandId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}