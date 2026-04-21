'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import RoleBadge from '@/components/shared/RoleBadge'
import AssignMemberPanel from '@/components/brands/AssignMemberPanel'
import { canAssignMembers } from '@/lib/auth/permissions'

export default function BrandDetailPage() {
  const { brandId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()

  const [brand, setBrand] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchBrand() }, [brandId])

  async function fetchBrand() {
    try {
      const res = await fetch(`/api/brands/${brandId}`)
      const data = await res.json()
      if (res.ok) {
        setBrand(data.brand)
        setMembers(data.members)
      } else {
        router.push('/brands')
      }
    } finally {
      setLoading(false)
    }
  }

  async function deleteBrand() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' })
      if (res.ok) router.push('/brands')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="p-10 text-sm text-gray-400">Loading...</div>
  }

  if (!brand) return null

  const canManage = session && canAssignMembers(session.user.role)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: `Members (${members.length})` },
  ]

  const navItems = [
    {
      label: 'Deliverables',
      desc: 'Videos, statics, carousels and more',
      href: `/brands/${brandId}/deliverables`,
    },
    {
      label: 'Tasks',
      desc: 'Kanban board — track work through the workflow',
      href: `/brands/${brandId}/tasks`,
    },
    {
      label: 'Analytics',
      desc: 'Weekly and monthly performance breakdown',
      href: `/brands/${brandId}/analytics`,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <button
          onClick={() => router.push('/brands')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-8 bg-transparent border-none cursor-pointer p-0 transition-colors"
        >
          ← Back to Brands
        </button>

        {/* Brand header card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className='flex gap-x-3 items-center'>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl shrink-0"
                style={{ background: brand.color || '#4f46e5' }}
              >
                {brand.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {brand.name}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Created by {brand.createdBy?.name || '—'} ·{' '}
                  {new Date(brand.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            {session?.user?.role === 'admin' && (
              <button
                onClick={() => setShowDelete(true)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer transition-colors"
              >
                Delete brand
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-none cursor-pointer ${activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 bg-transparent hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className="flex justify-between items-center p-5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all text-left w-full"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {item.desc}
                  </div>
                </div>
                <span className="text-gray-300 text-lg ml-4">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Tab: Members */}
        {activeTab === 'members' && (
          <div className="flex flex-col gap-4">

            {/* Header */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {members.length} member{members.length !== 1 ? 's' : ''} assigned to this brand
              </p>
              {canManage && (
                <button
                  onClick={() => setShowAssign(!showAssign)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer border transition-all ${showAssign
                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                    : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                  {showAssign ? 'Done' : 'Manage members'}
                </button>
              )}
            </div>

            {/* Assign panel */}
            {showAssign && canManage && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-600 mb-3">
                  Add or remove members
                </p>
                <AssignMemberPanel
                  brandId={brandId}
                  members={members}
                  onMembersChange={setMembers}
                />
              </div>
            )}

            {/* Members list */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {members.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-400">
                  No members yet. Click manage members to add someone.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                        {m.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {m.userId?.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate">
                          {m.userId?.email}
                        </div>
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
      {/* Delete confirm dialog */}
      {showDelete && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
          onClick={(e) => e.target === e.currentTarget && setShowDelete(false)}
        >
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Delete brand
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-900">{brand.name}</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border-none cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteBrand}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-lg border-none cursor-pointer transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}