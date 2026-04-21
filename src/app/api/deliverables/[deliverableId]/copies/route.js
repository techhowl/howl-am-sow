import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Copy from '@/lib/db/models/Copy'
import { canAddCopies } from '@/lib/auth/permissions'

// POST /api/deliverables/[deliverableId]/copies
export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canAddCopies(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { deliverableId } = await params
    const { title, content } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    await connectDB()

    const copy = await Copy.create({
      deliverableId,
      title: title.trim(),
      content: content || '',
      createdBy: session.user.id,
    })

    const populated = await Copy.findById(copy._id)
      .populate('createdBy', 'name')
      .lean()

    return NextResponse.json({ copy: populated }, { status: 201 })
  } catch (error) {
    console.error('POST copies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}