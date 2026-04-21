// src/app/(dashboard)/dashboard/page.jsx
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Brand from '@/lib/db/models/Brand'
import Task from '@/lib/db/models/Task'
import Deliverable from '@/lib/db/models/Deliverable'
import BrandMember from '@/lib/db/models/BrandMember'

const ROLE_LABELS = {
  admin: 'Admin',
  account_manager: 'Account Manager',
  designer: 'Designer',
  copywriter: 'Copywriter',
  motion_designer: 'Motion Designer',
  strategist: 'Strategist',
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5">
      <p className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">
        {value}
      </p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  const role = session?.user?.role
  const userId = session?.user?.id

  await connectDB()

  const isAdminOrAM = ['admin', 'account_manager'].includes(role)

  let brandIds = []

  if (isAdminOrAM) {
    const brands = await Brand.find({ isActive: true }).select('_id').lean()
    brandIds = brands.map((b) => b._id)
  } else {
    const memberships = await BrandMember.find({ userId }).select('brandId').lean()
    brandIds = memberships.map((m) => m.brandId)
  }

  const [activeBrands, deliverables, liveTasks, pendingTasks] = await Promise.all([
    Brand.countDocuments({ _id: { $in: brandIds }, isActive: true }),
    Deliverable.countDocuments({ brandId: { $in: brandIds } }),
    Task.countDocuments({ brandId: { $in: brandIds }, status: 'live' }),
    Task.countDocuments({
      brandId: { $in: brandIds },
      status: { $in: ['internal_review', 'sent_to_client'] },
    }),
  ])

  return (
    <div className="p-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-1">
          Good to see you, {session?.user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500">
          {ROLE_LABELS[role]} · SOW Tracker
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active brands" value={activeBrands} />
        <StatCard label="Deliverables" value={deliverables} />
        <StatCard label="Tasks live" value={liveTasks} />
        <StatCard label="Pending review" value={pendingTasks} />
      </div>

      {/* Getting started card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-sm font-medium text-gray-900 mb-1.5">Getting started</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          Head to{' '}
          <span className="font-semibold text-indigo-600">Brands</span> to set
          up your first brand workspace, assign team members, and start creating
          deliverables and tasks.
        </p>
      </div>

    </div>
  )
}