// src/app/api/brands/[brandId]/sow/route.js
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import SOW from '@/lib/db/models/SOW'
import Task from '@/lib/db/models/Task'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

// ─── Sanitize incoming items on save ──────────────────────────────────
function sanitizeItems(items) {
  return (items || []).map((i) => {
    let target = parseFloat(i.target)
    if (isNaN(target) || target < 0) target = 0
    // Round to 2 decimals to avoid float drift
    target = Math.round(target * 100) / 100

    return {
      type:     String(i.type || '').trim(),
      target,
      unitRate: Math.max(0, parseInt(i.unitRate) || 0),
      isCustom: Boolean(i.isCustom),
    }
  }).filter((i) => i.type.length > 0)
}

// Compute achieved counts per type for a month
async function computeAchievedByType(brandId, periodStart, periodEnd) {
  const tasks = await Task.find({
    brandId,
    createdAt: { $gte: periodStart, $lte: periodEnd },
    status:    { $in: ['approved', 'live'] },
  }).select('type').lean()

  const map = {}
  for (const t of tasks) {
    if (!t.type) continue
    map[t.type] = (map[t.type] || 0) + 1
  }
  return map
}

// ─── GET ──────────────────────────────────────────────────────────────
export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { brandId } = await params
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') || format(new Date(), 'yyyy-MM')

    await connectDB()

    const refDate     = new Date(`${month}-01`)
    const periodStart = startOfMonth(refDate)
    const periodEnd   = endOfMonth(refDate)

    let sow      = await SOW.findOne({ brandId, month }).lean()
    let baseline = null
    let suggestedCarryOvers = []

    // Achieved counts for this month (so SOWTab can show live "Delivered" column)
    const achievedByType = await computeAchievedByType(brandId, periodStart, periodEnd)

    // If no SOW yet for this month, check last month for baseline + carry-overs
    if (!sow) {
      const lastMonthDate = subMonths(refDate, 1)
      const lastMonth     = format(lastMonthDate, 'yyyy-MM')
      const lastSOW       = await SOW.findOne({ brandId, month: lastMonth }).lean()

      if (lastSOW) {
        baseline = lastSOW.items
        const lastStart = startOfMonth(lastMonthDate)
        const lastEnd   = endOfMonth(lastMonthDate)
        const lastAchieved = await computeAchievedByType(brandId, lastStart, lastEnd)

        suggestedCarryOvers = lastSOW.items
          .map((item) => {
            const achieved = lastAchieved[item.type] || 0
            const diff     = achieved - (item.target || 0)
            if (Math.abs(diff) < 0.01) return null  // ignore zero-ish (float safety)

            // amount = adjustment to next month's target
            // If overdelivered (diff > 0), reduce next month's target → amount = -diff
            // If underdelivered (diff < 0), increase next month → amount = -diff (positive)
            const amount      = -diff
            const moneyImpact = amount * (item.unitRate || 0)

            return {
              type:        item.type,
              amount:      Math.round(amount * 100) / 100,
              moneyImpact: Math.round(moneyImpact),
              suggestedUnitRate: item.unitRate || 0,
              fromMonth:   lastMonth,
              note:        diff > 0
                ? `Overdelivered ${diff > 1 ? Math.round(diff) : diff.toFixed(2)} units last month — reduce by ${Math.abs(amount) > 1 ? Math.round(Math.abs(amount)) : Math.abs(amount).toFixed(2)}`
                : `Underdelivered ${Math.abs(diff) > 1 ? Math.round(Math.abs(diff)) : Math.abs(diff).toFixed(2)} units last month — add ${amount > 1 ? Math.round(amount) : amount.toFixed(2)}`,
              confirmedByAM: false,
            }
          })
          .filter(Boolean)
      }
    }

    return NextResponse.json({
      sow,
      baseline,
      month,
      suggestedCarryOvers,
      achievedByType,
    })
  } catch (err) {
    console.error('GET /sow error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ─── POST ─────────────────────────────────────────────────────────────
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

    const sanitizedItems = sanitizeItems(items)
    if (!sanitizedItems.length) {
      return NextResponse.json({ error: 'At least one valid item is required' }, { status: 400 })
    }

    const sow = await SOW.findOneAndUpdate(
      { brandId, month },
      {
        $set: {
          items:      sanitizedItems,
          carryOvers,
          updatedBy:  session.user.id,
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