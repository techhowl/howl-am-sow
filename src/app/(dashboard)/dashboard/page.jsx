// src/app/(dashboard)/dashboard/page.jsx
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Brand from '@/lib/db/models/Brand'
import Task from '@/lib/db/models/Task'
import BrandMember from '@/lib/db/models/BrandMember'
import Link from 'next/link'
import { Layers, Zap, Clock, ArrowRight, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { MotionList, MotionItem } from '@/components/shared/motion/MotionList'

const ROLE_LABELS = {
  superadmin:      'Super Admin',
  admin:           'Admin',
  account_manager: 'Account Manager',
  designer:        'Designer',
  copywriter:      'Copywriter',
  motion_designer: 'Motion Designer',
  user:            'User',
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
  copy_wip:        'bg-[--color-chart-4]/15 text-[--color-chart-4]',
  video_wip:       'bg-[--color-chart-5]/15 text-[--color-chart-5]',
  design_wip:      'bg-[--color-chart-2]/15 text-[--color-chart-2]',
  internal_review: 'bg-warning/10 text-warning',
  sent_to_client:  'bg-[--color-chart-1]/15 text-[--color-chart-1]',
  approved:        'bg-success/10 text-success',
  rejected:        'bg-destructive/10 text-destructive',
  live:            'bg-success/10 text-success',
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
    <div className="min-h-screen bg-background p-8">

      {/* Header */}
      <PageHeader
        eyebrow="DASHBOARD"
        title={`Welcome back, ${firstName}`}
        lede={`${ROLE_LABELS[role]} · SOW Tracker`}
      />

      {/* My stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="My Active Tasks"
          value={myPending}
          icon={Clock}
          tone="--primary"
        />
        <StatCard
          label="Completed (Live)"
          value={myLive}
          icon={CheckCircle2}
          tone="--success"
        />
        <StatCard
          label="Needs Revision"
          value={myRejected}
          icon={RotateCcw}
          tone="--destructive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* My Tasks */}
        <div className="lg:col-span-2 surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">My Tasks</h2>
            <Link href="/timeline" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              View timeline →
            </Link>
          </div>

          {myTasks.length === 0 ? (
            <div className="flex flex-col items-center text-center py-12">
              <span className="empty-art mb-4"><CheckCircle2 className="h-6 w-6" /></span>
              <p className="eyebrow mb-2">NOTHING YET</p>
              <p className="text-sm text-muted-foreground max-w-xs">No active tasks assigned to you</p>
              <p className="text-xs text-muted-foreground mt-1">Your manager will assign tasks to you soon</p>
            </div>
          ) : (
            <MotionList className="space-y-1.5">
              {myTasks.map((task) => (
                <MotionItem
                  key={task._id}
                  className={`flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
                    task.status === 'rejected'
                      ? 'bg-destructive/10 border border-destructive/30'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.status === 'rejected' && (
                      <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    )}
                    {task.brandId?.color && task.status !== 'rejected' && (
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: task.brandId.color }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      {task.brandId?.name && (
                        <p className="text-xs text-muted-foreground mt-0.5">{task.brandId.name}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium ml-3 shrink-0 px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] || 'bg-muted text-muted-foreground'}`}>
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </MotionItem>
              ))}
            </MotionList>
          )}
        </div>

        {/* My Brands + quick links */}
        <div className="flex flex-col gap-4">

          {/* My Brands */}
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">My Brands</h2>
            {myBrands.length === 0 ? (
              <p className="text-xs text-muted-foreground">Not assigned to any brand yet</p>
            ) : (
              <MotionList className="space-y-2">
                {myBrands.map((brand) => (
                  <MotionItem key={brand._id}>
                  <Link
                    href={`/brands/${brand._id}/tasks`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: brand.color || '#4f46e5' }}
                    >
                      {brand.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate flex-1">
                      {brand.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                  </Link>
                  </MotionItem>
                ))}
              </MotionList>
            )}
          </div>

          {/* Quick links */}
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Quick Links</h2>
            <div className="space-y-1.5">
              {[
                { href: '/brands',   label: 'Brands',   desc: 'Your workspaces' },
                { href: '/timeline', label: 'Timeline', desc: 'All deadlines' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-muted hover:border-border transition-all group"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{link.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
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
    <div className="min-h-screen bg-background p-8">

      {/* Header */}
      <PageHeader
        eyebrow="DASHBOARD"
        title={`Welcome back, ${firstName}`}
        lede={`${ROLE_LABELS[role]} · SOW Tracker`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Active Brands"
          value={activeBrands}
          icon={Layers}
          tone="--primary"
          href="/brands"
        />
        <StatCard
          label="Tasks Live"
          value={liveTasks}
          icon={Zap}
          tone="--success"
        />
        <StatCard
          label="Pending Review"
          value={pendingTasks}
          icon={Clock}
          tone="--warning"
          href="/timeline"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent tasks */}
        <div className="lg:col-span-2 surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Recent Tasks</h2>
            <Link href="/brands" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              View all →
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
          ) : (
            <MotionList className="space-y-1">
              {recentTasks.map((task) => (
                <MotionItem
                  key={task._id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.brandId?.color && (
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: task.brandId.color }} />
                    )}
                    <p className="text-sm text-foreground truncate">{task.title}</p>
                    {task.brandId?.name && (
                      <span className="text-xs text-muted-foreground hidden sm:block shrink-0">{task.brandId.name}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ml-3 shrink-0 px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] || 'bg-muted text-muted-foreground'}`}>
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </MotionItem>
              ))}
            </MotionList>
          )}
        </div>

        {/* Quick links */}
        <div className="surface-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Quick Links</h2>
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
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted hover:border-border transition-all group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{link.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{link.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
              </Link>
            ))}
          </div>
          <div className="h-px bg-border mt-5 mb-4" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Head to <span className="text-primary">Brands</span> to manage workspaces and assign tasks.
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

  const isAdminOrAM = ['superadmin', 'admin', 'account_manager'].includes(role)

  if (isAdminOrAM) {
    return <AdminDashboard userId={userId} firstName={firstName} role={role} />
  }

  return <EmployeeDashboard userId={userId} firstName={firstName} role={role} />
}