import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Deliverable from '@/lib/db/models/Deliverable'
import Copy from '@/lib/db/models/Copy'
import Asset from '@/lib/db/models/Asset'
import { canManageDeliverables } from '@/lib/auth/permissions'

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { deliverableId } = await params
    await connectDB()

    const deliverable = await Deliverable.findById(deliverableId)
      .populate('createdBy', 'name')
      .populate('parentDeliverableId', 'name type')
      .lean()

    if (!deliverable) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 })
    }

    const copies = await Copy.find({ deliverableId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean()

    const assets = await Asset.find({ deliverableId })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .lean()

    const adapts = await Deliverable.find({ parentDeliverableId: deliverableId })
      .populate('createdBy', 'name')
      .lean()

    return NextResponse.json({ deliverable, copies, assets, adapts })
  } catch (error) {
    console.error('GET deliverable error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canManageDeliverables(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { deliverableId } = await params
    await connectDB()

    await Deliverable.findByIdAndDelete(deliverableId)
    await Copy.deleteMany({ deliverableId })
    await Asset.deleteMany({ deliverableId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE deliverable error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}