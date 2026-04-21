import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Deliverable from '@/lib/db/models/Deliverable'
import BrandMember from '@/lib/db/models/BrandMember'
import { canManageDeliverables } from '@/lib/auth/permissions'

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brandId } = await params
    await connectDB()

    if (!['admin', 'account_manager'].includes(session.user.role)) {
      const member = await BrandMember.findOne({ brandId, userId: session.user.id })
      if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deliverables = await Deliverable.find({ brandId })
      .populate('createdBy', 'name')
      .populate('parentDeliverableId', 'name type')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ deliverables })
  } catch (error) {
    console.error('GET deliverables error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canManageDeliverables(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { brandId } = await params
    const body = await req.json()
    const { name, type, customTypeName, parentDeliverableId, description } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    if (type === 'custom' && !customTypeName) {
      return NextResponse.json({ error: 'Custom type name is required' }, { status: 400 })
    }

    await connectDB()

    const deliverable = await Deliverable.create({
      brandId,
      name: name.trim(),
      type,
      customTypeName: type === 'custom' ? customTypeName.trim() : null,
      parentDeliverableId: parentDeliverableId || null,
      description: description?.trim() || null,
      createdBy: session.user.id,
    })

    return NextResponse.json({ deliverable }, { status: 201 })
  } catch (error) {
    console.error('POST deliverables error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}