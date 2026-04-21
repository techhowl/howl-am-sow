import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Copy from '@/lib/db/models/Copy'
import { canAddCopies } from '@/lib/auth/permissions'

// PATCH /api/deliverables/[deliverableId]/copies/[copyId]
export async function PATCH(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canAddCopies(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { copyId } = await params
    const { title, content } = await req.json()

    await connectDB()

    const copy = await Copy.findByIdAndUpdate(
      copyId,
      { $set: { title, content } },
      { new: true }
    ).populate('createdBy', 'name')

    if (!copy) return NextResponse.json({ error: 'Copy not found' }, { status: 404 })

    return NextResponse.json({ copy })
  } catch (error) {
    console.error('PATCH copy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/deliverables/[deliverableId]/copies/[copyId]
export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canAddCopies(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { copyId } = await params
    await connectDB()

    await Copy.findByIdAndDelete(copyId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE copy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}