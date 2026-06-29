'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ListChecks, BarChart3, Users as UsersIcon, Calendar, Trash2, ArrowRight } from 'lucide-react'
import RoleBadge from '@/components/shared/RoleBadge'
import AssignMemberPanel from '@/components/brands/AssignMemberPanel'
import SOWTab from '@/components/brands/SOWTab'
import { canAssignMembers, canManageSOW } from '@/lib/auth/permissions'
import { IconMedallion } from '@/components/shared/IconMedallion'
import { MotionList, MotionItem } from '@/components/shared/motion/MotionList'
import { AnimatedGradient } from '@/components/ui/animated-gradient-with-svg'
import { cn } from '@/lib/utils'

export default function BrandDetailPage() {
  const { brandId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()

  const [brand, setBrand]     = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [activeTab, setActiveTab]   = useState('overview')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  useEffect(() => { fetchBrand() }, [brandId])

  async function fetchBrand() {
    try {
      const res  = await fetch(`/api/brands/${brandId}`)
      const data = await res.json()
      if (res.ok) { setBrand(data.brand); setMembers(data.members) }
      else router.push('/brands')
    } finally { setLoading(false) }
  }

  async function deleteBrand() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' })
      if (res.ok) router.push('/brands')
    } finally { setDeleting(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-sm text-muted-foreground"
          >
            Loading brand...
          </motion.p>
        </motion.div>
      </div>
    )
  }
  if (!brand) return null

  const canManage    = session && canAssignMembers(session.user.role)
  const canEditSOW   = canManageSOW(session?.user?.role)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sow',      label: 'Scope of Work' },
    { id: 'members',  label: `Members (${members.length})` },
  ]

  const navItems = [
    { label: 'Tasks',     icon: ListChecks, tone: '--primary',  desc: 'Kanban board — track work through the workflow', href: `/brands/${brandId}/tasks` },
    { label: 'Analytics', icon: BarChart3,  tone: '--accent-2', desc: 'SOW progress and performance breakdown',          href: `/brands/${brandId}/analytics` },
  ]

  const createdLabel = new Date(brand.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <button onClick={() => router.push('/brands')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 bg-transparent border-none cursor-pointer p-0 transition-colors"
        >
          ← Back to Brands
        </button>

        {/* Brand header */}
        <div className="surface-card gloss p-6 mb-5 relative overflow-hidden">
          {/* Animated gradient using brand color */}
          <AnimatedGradient 
            colors={[
              brand.color || 'oklch(0.52 0.17 300)',
              `color-mix(in oklab, ${brand.color || 'oklch(0.52 0.17 300)'} 70%, oklch(0.60 0.12 268))`,
              `color-mix(in oklab, ${brand.color || 'oklch(0.52 0.17 300)'} 50%, oklch(0.68 0.15 355))`
            ]}
            speed={0.02}
            blur="medium"
          />
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex gap-4 items-center min-w-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display font-bold text-2xl shrink-0 glass-thick border border-white/20"
                style={{
                  background: `linear-gradient(140deg, ${brand.color || '#7c3aed'}, color-mix(in oklab, ${brand.color || '#7c3aed'} 65%, #000))`,
                  boxShadow: `0 6px 20px color-mix(in oklab, ${brand.color || '#7c3aed'} 45%, transparent)`,
                }}>
                {brand.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="eyebrow">Brand workspace</p>
                <h1 className="editorial-h2 text-foreground truncate">{brand.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="chip" data-tone="primary"><UsersIcon size={12} aria-hidden="true" />{members.length} member{members.length !== 1 ? 's' : ''}</span>
                  <span className="chip"><Calendar size={12} aria-hidden="true" />{createdLabel}</span>
                  <span className="chip">by {brand.createdBy?.name || '—'}</span>
                </div>
              </div>
            </div>
            {['superadmin', 'admin'].includes(session?.user?.role) && (
              <button onClick={() => setShowDelete(true)} aria-label="Delete brand"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive cursor-pointer"
              ><Trash2 size={15} aria-hidden="true" /></button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-thin flex gap-1 mb-6 rounded-lg p-1 w-fit">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all border-none cursor-pointer',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-[0_2px_12px_color-mix(in_oklab,var(--primary)_45%,transparent)]'
                  : 'text-muted-foreground bg-transparent hover:text-foreground'
              )}
            >{tab.label}</button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <MotionList className="grid gap-3 sm:grid-cols-2">
            {navItems.map((item) => (
              <MotionItem key={item.label} className="h-full">
                <button onClick={() => router.push(item.href)}
                  className="surface-card surface-card-hover gloss group flex h-full w-full items-start gap-4 p-5 text-left cursor-pointer"
                >
                  <IconMedallion icon={item.icon} tone={item.tone} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      {item.label}
                      <ArrowRight size={14} className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</div>
                  </div>
                </button>
              </MotionItem>
            ))}
          </MotionList>
        )}

        {/* SOW Tab */}
        {activeTab === 'sow' && (
          <SOWTab brandId={brandId} canManage={canEditSOW} brandName={brand.name} />
        )}

        {/* Members */}
        {activeTab === 'members' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''} assigned to this brand</p>
              {canManage && (
                <button onClick={() => setShowAssign(!showAssign)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer border transition-all ${
                    showAssign ? 'bg-muted text-foreground border-border' : 'bg-primary text-primary-foreground border-primary/40 hover:bg-primary/90'
                  }`}
                >{showAssign ? 'Done' : 'Manage members'}</button>
              )}
            </div>
            {showAssign && canManage && (
              <div className="glass-thin rounded-lg p-4">
                <p className="eyebrow mb-3">Add or remove members</p>
                <AssignMemberPanel brandId={brandId} members={members} onMembersChange={setMembers} />
              </div>
            )}
            <div className="surface-card overflow-hidden">
              {members.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {members.map((m) => (
                    <div key={m._id} className="flex items-center gap-3 px-5 py-4 hover:bg-muted transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center shrink-0">
                        {m.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{m.userId?.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{m.userId?.email}</div>
                      </div>
                      <RoleBadge role={m.userId?.role} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowDelete(false)}
        >
          <div className="modal max-w-sm">
            <div className="modal-header">
              <h2 className="text-base font-semibold text-foreground">Delete brand</h2>
            </div>
            <div className="modal-body">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-medium text-foreground">{brand.name}</span>? This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDelete(false)} className="btn-ghost">Cancel</button>
              <button onClick={deleteBrand} disabled={deleting} className="btn-danger">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}