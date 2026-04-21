import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Asset from '@/lib/db/models/Asset'
import { canAddAssets } from '@/lib/auth/permissions'

// POST /api/deliverables/[deliverableId]/assets
export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canAddAssets(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { deliverableId } = await params
    const { title, link, assetType } = await req.json()

    if (!title || !link) {
      return NextResponse.json({ error: 'Title and link are required' }, { status: 400 })
    }

    await connectDB()

    const asset = await Asset.create({
      deliverableId,
      title: title.trim(),
      link: link.trim(),
      assetType: assetType || 'other',
      uploadedBy: session.user.id,
    })

    const populated = await Asset.findById(asset._id)
      .populate('uploadedBy', 'name')
      .lean()

    return NextResponse.json({ asset: populated }, { status: 201 })
  } catch (error) {
    console.error('POST assets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}