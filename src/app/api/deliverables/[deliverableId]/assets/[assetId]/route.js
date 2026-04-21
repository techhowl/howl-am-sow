import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Asset from '@/lib/db/models/Asset'
import { canAddAssets } from '@/lib/auth/permissions'

// DELETE /api/deliverables/[deliverableId]/assets/[assetId]
export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canAddAssets(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { assetId } = await params
    await connectDB()

    await Asset.findByIdAndDelete(assetId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE asset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}