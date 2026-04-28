// src/app/(dashboard)/dashboard/page.jsx
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Brand from '@/lib/db/models/Brand'
import Task from '@/lib/db/models/Task'
import BrandMember from '@/lib/db/models/BrandMember'
import Link from 'next/link'
import { Layers, Zap, Clock, ArrowRight } from 'lucide-react'

const ROLE_LABELS = {
  admin:           'Admin',
  account_manager: 'Account Manager',
  designer:        'Designer',
  copywriter:      'Copywriter',
  motion_designer: 'Motion Designer',
  strategist:      'Strategist',
}

const STATUS_LABELS = {
  copy_wip:        'Copy WIP',
  video_wip:       'Video WIP',
  design_wip:      'Design WIP',
  internal_review: 'Internal Review',
  sent_to_client:  'Sent to Client',
  approved:        'Approved',
  rejected:        'Rejected',
  live:            'Live',
}

function StatCard({ label, value, icon: Icon, accentClass, href }) {
  const inner = (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all group cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-3xl font-semibold text-gray-900 tracking-tight mb-1">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  )
  if (href) return <Link href={href}>{inner}</Link>
  return inner
}

export default async function DashboardPage() {
  const session   = await auth()
  const role      = session?.user?.role
  const userId    = session?.user?.id
  const firstName = session?.user?.name?.split(' ')[0] || 'there'

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

  const [activeBrands, liveTasks, pendingTasks] = await Promise.all([
    Brand.countDocuments({ _id: { $in: brandIds }, isActive: true }),
    Task.countDocuments({ brandId: { $in: brandIds }, status: 'live' }),
    Task.countDocuments({
      brandId: { $in: brandIds },
      status:  { $in: ['internal_review', 'sent_to_client'] },
    }),
  ])

  const recentTasks = await Task.find({ brandId: { $in: brandIds } })
    .populate('brandId', 'name color')
    .sort({ createdAt: -1 })
    .limit(6)
    .lean()

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
          Good to see you, {firstName}
        </h1>
        <p className="text-sm text-gray-400 mt-1">{ROLE_LABELS[role]} · SOW Tracker</p>
      </div>

      {/* Stat cards — 3 cards now (no deliverables) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Active Brands"
          value={activeBrands}
          icon={Layers}
          accentClass="bg-indigo-50 text-indigo-600"
          href="/brands"
        />
        <StatCard
          label="Tasks Live"
          value={liveTasks}
          icon={Zap}
          accentClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Pending Review"
          value={pendingTasks}
          icon={Clock}
          accentClass="bg-amber-50 text-amber-600"
          href="/timeline"
        />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent tasks */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Tasks</h2>
            <Link href="/brands" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
              View all →
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No tasks yet — create one from a brand
            </p>
          ) : (
            <div className="space-y-1">
              {recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.brandId?.color && (
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: task.brandId.color }}
                      />
                    )}
                    <p className="text-sm text-gray-700 truncate">{task.title}</p>
                    {task.brandId?.name && (
                      <span className="text-xs text-gray-400 hidden sm:block shrink-0">
                        {task.brandId.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium ml-3 shrink-0 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="space-y-2">
            {[
              { href: '/brands',   label: 'Brands',   desc: 'Manage workspaces' },
              { href: '/timeline', label: 'Timeline', desc: 'Cross-brand deadlines' },
              ...(isAdminOrAM ? [
                { href: '/analytics', label: 'Analytics', desc: 'Performance & stats' },
                { href: '/users',     label: 'Users',     desc: 'Team management' },
              ] : []),
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{link.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-60 transition-opacity" />
              </Link>
            ))}
          </div>

          <div className="h-px bg-gray-100 mt-5 mb-4" />
          <p className="text-xs text-gray-400 leading-relaxed">
            Head to <span className="text-indigo-600">Brands</span> to set up a
            workspace and start creating tasks.
          </p>
        </div>
      </div>
    </div>
  )
}