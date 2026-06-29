// src/app/(dashboard)/dashboard/page.jsx
import { auth } from '@/lib/auth/auth'
import connectDB from '@/lib/db/mongoose'
import Brand from '@/lib/db/models/Brand'
import Task from '@/lib/db/models/Task'
import BrandMember from '@/lib/db/models/BrandMember'
import { AdminDashboardClient, EmployeeDashboardClient } from './DashboardClient'
import { isManagement } from '@/lib/auth/permissions'

const ROLE_LABELS = {
  superadmin:            'Super Admin',
  admin:                 'Admin',
  account_manager:       'Account Manager',
  management_trainee_am: 'Management Trainee AM',
  executive_am:          'Executive AM',
  senior_am:             'Senior AM',
  lead_am:               'Lead AM',
  designer:              'Designer',
  copywriter:            'Copywriter',
  motion_designer:       'Motion Designer',
  user:                  'User',
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

  // Convert to plain objects for client components
  const plainTasks = myTasks.map(task => ({
    _id: task._id.toString(),
    title: task.title,
    status: task.status,
    brandId: task.brandId ? {
      _id: task.brandId._id.toString(),
      name: task.brandId.name,
      color: task.brandId.color
    } : null
  }))

  const plainBrands = myBrands.map(brand => ({
    _id: brand._id.toString(),
    name: brand.name,
    color: brand.color
  }))

  return (
    <EmployeeDashboardClient
      firstName={firstName}
      role={role}
      roleLabel={ROLE_LABELS[role] || role}
      myPending={myPending}
      myLive={myLive}
      myRejected={myRejected}
      myTasks={plainTasks}
      myBrands={plainBrands}
    />
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

  // Convert to plain objects for client components
  const plainRecentTasks = recentTasks.map(task => ({
    _id: task._id.toString(),
    title: task.title,
    status: task.status,
    brandId: task.brandId ? {
      _id: task.brandId._id.toString(),
      name: task.brandId.name,
      color: task.brandId.color
    } : null
  }))

  return (
    <AdminDashboardClient
      firstName={firstName}
      role={role}
      roleLabel={ROLE_LABELS[role] || role}
      activeBrands={activeBrands}
      liveTasks={liveTasks}
      pendingTasks={pendingTasks}
      recentTasks={plainRecentTasks}
    />
  )
}

// ── Root page — routes to correct dashboard by role ────────────────────────
export default async function DashboardPage() {
  const session   = await auth()
  const role      = session?.user?.role
  const userId    = session?.user?.id
  const firstName = session?.user?.name?.split(' ')[0] || 'there'

  await connectDB()

  const isAdminOrAM = isManagement(role)

  if (isAdminOrAM) {
    return <AdminDashboard userId={userId} firstName={firstName} role={role} />
  }

  return <EmployeeDashboard userId={userId} firstName={firstName} role={role} />
}