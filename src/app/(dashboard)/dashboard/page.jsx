// src/app/(dashboard)/dashboard/page.jsx
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Brand from '@/lib/db/models/Brand'
import Task from '@/lib/db/models/Task'
import BrandMember from '@/lib/db/models/BrandMember'
import Link from 'next/link'
import { Layers, Zap, Clock, ArrowRight, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'

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

const STATUS_COLORS = {
  copy_wip:        'bg-purple-100 text-purple-700',
  video_wip:       'bg-violet-100 text-violet-700',
  design_wip:      'bg-blue-100 text-blue-700',
  internal_review: 'bg-amber-100 text-amber-700',
  sent_to_client:  'bg-cyan-100 text-cyan-700',
  approved:        'bg-green-100 text-green-700',
  rejected:        'bg-red-100 text-red-700',
  live:            'bg-emerald-100 text-emerald-700',
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

// ── Employee dashboard (designers, copywriters, etc.) ──────────────────────
async function EmployeeDashboard({ userId, firstName, role }) {
  // My assigned tasks — only tasks where I am an assignee
  const myTasks = await Task.find({
    assignees: userId,
    status:    { $ne: 'live' },
  })
    .populate('brandId', 'name color')
    .sort({ createdAt: -1 })
    .lean()

  const myLive     = await Task.countDocuments({ assignees: userId, status: 'live' })
  const myPending  = await Task.countDocuments({ assignees: userId, status: { $nin: ['live', 'approved'] } })
  const myRejected = await Task.countDocuments({ assignees: userId, status: 'rejected' })

  // Brand memberships
  const memberships = await BrandMember.find({ userId }).populate('brandId', 'name color').lean()
  const myBrands    = memberships.map((m) => m.brandId).filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-gray-400 mt-1">{ROLE_LABELS[role]} · SOW Tracker</p>
      </div>

      {/* My stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="My Active Tasks"
          value={myPending}
          icon={Clock}
          accentClass="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Completed (Live)"
          value={myLive}
          icon={CheckCircle2}
          accentClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Needs Revision"
          value={myRejected}
          icon={RotateCcw}
          accentClass="bg-red-50 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* My Tasks */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">My Tasks</h2>
            <Link href="/timeline" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
              View timeline →
            </Link>
          </div>

          {myTasks.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No active tasks assigned to you</p>
              <p className="text-xs text-gray-300 mt-1">Your manager will assign tasks to you soon</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {myTasks.map((task) => (
                <div
                  key={task._id}
                  className={`flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
                    task.status === 'rejected'
                      ? 'bg-red-50 border border-red-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.status === 'rejected' && (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    {task.brandId?.color && task.status !== 'rejected' && (
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: task.brandId.color }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      {task.brandId?.name && (
                        <p className="text-xs text-gray-400 mt-0.5">{task.brandId.name}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium ml-3 shrink-0 px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Brands + quick links */}
        <div className="flex flex-col gap-4">

          {/* My Brands */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">My Brands</h2>
            {myBrands.length === 0 ? (
              <p className="text-xs text-gray-400">Not assigned to any brand yet</p>
            ) : (
              <div className="space-y-2">
                {myBrands.map((brand) => (
                  <Link
                    key={brand._id}
                    href={`/brands/${brand._id}/tasks`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: brand.color || '#4f46e5' }}
                    >
                      {brand.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate flex-1">
                      {brand.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h2>
            <div className="space-y-1.5">
              {[
                { href: '/brands',   label: 'Brands',   desc: 'Your workspaces' },
                { href: '/timeline', label: 'Timeline', desc: 'All deadlines' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{link.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-60 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Admin / AM dashboard ───────────────────────────────────────────────────
async function AdminDashboard({ userId, firstName, role }) {
  const brands    = await Brand.find({ isActive: true }).select('_id').lean()
  const brandIds  = brands.map((b) => b._id)

  const [activeBrands, liveTasks, pendingTasks] = await Promise.all([
    Brand.countDocuments({ isActive: true }),
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

  const isAdminOrAM = true

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
          Good to see you, {firstName}
        </h1>
        <p className="text-sm text-gray-400 mt-1">{ROLE_LABELS[role]} · SOW Tracker</p>
      </div>

      {/* Stat cards */}
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
            <p className="text-sm text-gray-400 text-center py-8">No tasks yet</p>
          ) : (
            <div className="space-y-1">
              {recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.brandId?.color && (
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: task.brandId.color }} />
                    )}
                    <p className="text-sm text-gray-700 truncate">{task.title}</p>
                    {task.brandId?.name && (
                      <span className="text-xs text-gray-400 hidden sm:block shrink-0">{task.brandId.name}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ml-3 shrink-0 px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-500'}`}>
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
              { href: '/brands',    label: 'Brands',    desc: 'Manage workspaces' },
              { href: '/timeline',  label: 'Timeline',  desc: 'Cross-brand deadlines' },
              { href: '/analytics', label: 'Analytics', desc: 'Performance & stats' },
              { href: '/users',     label: 'Users',     desc: 'Team management' },
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
            Head to <span className="text-indigo-600">Brands</span> to manage workspaces and assign tasks.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Root page — routes to correct dashboard by role ────────────────────────
export default async function DashboardPage() {
  const session   = await auth()
  const role      = session?.user?.role
  const userId    = session?.user?.id
  const firstName = session?.user?.name?.split(' ')[0] || 'there'

  await connectDB()

  const isAdminOrAM = ['admin', 'account_manager'].includes(role)

  if (isAdminOrAM) {
    return <AdminDashboard userId={userId} firstName={firstName} role={role} />
  }

  return <EmployeeDashboard userId={userId} firstName={firstName} role={role} />
}