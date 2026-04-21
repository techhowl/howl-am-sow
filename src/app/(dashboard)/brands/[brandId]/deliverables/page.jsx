'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import TypeBadge from '@/components/shared/TypeBadge'
import CreateDeliverableModal from '@/components/deliverables/CreateDeliverableModal'
import { canManageDeliverables } from '@/lib/auth/permissions'

export default function DeliverablesPage() {
  const { brandId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()

  const [deliverables, setDeliverables] = useState([])
  const [brand, setBrand] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => { fetchData() }, [brandId])

  async function fetchData() {
    try {
      const [brandRes, delRes] = await Promise.all([
        fetch(`/api/brands/${brandId}`),
        fetch(`/api/brands/${brandId}/deliverables`),
      ])
      const brandData = await brandRes.json()
      const delData = await delRes.json()
      if (brandRes.ok) setBrand(brandData.brand)
      if (delRes.ok) setDeliverables(delData.deliverables)
    } finally {
      setLoading(false)
    }
  }

  const types = ['all', ...new Set(deliverables.map((d) => d.type))]

  const filtered = deliverables.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || d.type === filterType
    return matchSearch && matchType
  })

  const canCreate = session && canManageDeliverables(session.user.role)

  const TYPE_LABELS = {
    all: 'All',
    video: 'Video',
    video_adapt: 'Video Adapt',
    static: 'Static',
    static_adapt: 'Static Adapt',
    carousel: 'Carousel',
    gif: 'GIF',
    performance_asset: 'Performance',
    custom: 'Custom',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <button
          onClick={() => router.push(`/brands/${brandId}`)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 bg-transparent border-none cursor-pointer p-0 transition-colors"
        >
          ← {brand?.name || 'Brand'}
        </button>

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Deliverables
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {deliverables.length} total
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg border-none cursor-pointer transition-colors"
            >
              Add deliverable
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Search deliverables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52 px-3 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <div className="flex gap-1.5 flex-wrap">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border-none cursor-pointer transition-colors ${
                  filterType === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-500 hover:text-gray-700 border border-gray-200'
                }`}
              >
                {TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <p className="text-sm text-gray-400 mb-4">
              {search || filterType !== 'all'
                ? 'No deliverables match your filters.'
                : 'No deliverables yet.'}
            </p>
            {canCreate && !search && filterType === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border-none cursor-pointer transition-colors"
              >
                Add first deliverable
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filtered.map((d) => (
                <div
                  key={d._id}
                  onClick={() => router.push(`/brands/${brandId}/deliverables/${d._id}`)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <span className="text-indigo-600 text-xs font-bold">
                      {d.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {d.name}
                    </div>
                    {d.description && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        {d.description}
                      </div>
                    )}
                    {d.parentDeliverableId && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Adapt of: {d.parentDeliverableId.name}
                      </div>
                    )}
                  </div>

                  {/* Type */}
                  <TypeBadge type={d.type} customTypeName={d.customTypeName} />

                  {/* Date */}
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(d.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>

                  <span className="text-gray-300">→</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {showModal && (
        <CreateDeliverableModal
          brandId={brandId}
          deliverables={deliverables}
          customDeliverableTypes={brand?.customDeliverableTypes || []}
          onClose={() => setShowModal(false)}
          onCreated={(d) => setDeliverables((prev) => [d, ...prev])}
        />
      )}
    </div>
  )
}