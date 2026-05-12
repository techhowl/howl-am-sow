// src/app/api/brands/[brandId]/sow/route.js
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import SOW from '@/lib/db/models/SOW'
import Task from '@/lib/db/models/Task'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

// GET — fetch SOW for a given month, detect carry-overs from last month
export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brandId } = await params
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') || format(new Date(), 'yyyy-MM')

    await connectDB()

    let sow = await SOW.findOne({ brandId, month }).lean()

    let suggestedCarryOvers = []
    let baseline = null

    // If no SOW yet for this month, check last month for baseline + carry-overs
    if (!sow) {
      const lastMonthDate = subMonths(new Date(`${month}-01`), 1)
      const lastMonth     = format(lastMonthDate, 'yyyy-MM')
      const lastSOW       = await SOW.findOne({ brandId, month: lastMonth }).lean()

      if (lastSOW) {
        baseline = lastSOW.items

        const lastStart = startOfMonth(lastMonthDate)
        const lastEnd   = endOfMonth(lastMonthDate)
        const lastTasks = await Task.find({
          brandId,
          createdAt: { $gte: lastStart, $lte: lastEnd },
        }).lean()

        suggestedCarryOvers = lastSOW.items
          .map((item) => {
            const achieved = lastTasks.filter(
              (t) => t.type === item.type && ['approved', 'live'].includes(t.status)
            ).length
            const diff = achieved - item.target
            if (diff !== 0) {
              return {
                type:      item.type,
                amount:    -diff,
                fromMonth: lastMonth,
                note:      diff > 0
                  ? `+${diff} surplus from ${lastMonth} — consider reducing target by ${diff}`
                  : `${Math.abs(diff)} deficit from ${lastMonth} — consider increasing target by ${Math.abs(diff)}`,
                confirmedByAM: false,
              }
            }
            return null
          })
          .filter(Boolean)
      }
    }

    return NextResponse.json({ sow, baseline, month, suggestedCarryOvers })
  } catch (err) {
    console.error('GET /sow error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — create or update SOW for a month
export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'account_manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { brandId } = await params
    await connectDB()

    const body = await req.json()
    const { month, items, carryOvers = [] } = body

    if (!month || !items?.length) {
      return NextResponse.json({ error: 'month and items are required' }, { status: 400 })
    }

    const sow = await SOW.findOneAndUpdate(
      { brandId, month },
      {
        $set: {
          items,
          carryOvers,
          updatedBy: session.user.id,
        },
        $setOnInsert: {
          brandId,
          month,
          createdBy: session.user.id,
        },
      },
      { upsert: true, new: true }
    ).lean()

    return NextResponse.json({ sow }, { status: 201 })
  } catch (err) {
    console.error('POST /sow error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}