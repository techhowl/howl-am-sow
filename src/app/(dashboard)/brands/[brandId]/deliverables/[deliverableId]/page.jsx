'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import TypeBadge from '@/components/shared/TypeBadge'
import { canAddCopies, canAddAssets, canManageDeliverables } from '@/lib/auth/permissions'

const ASSET_TYPES = [
  { value: 'other', label: 'Other' },
  { value: 'google_drive', label: 'Google Drive' },
  { value: 'frame_io', label: 'Frame.io' },
  { value: 'dropbox', label: 'Dropbox' },
]

const inputClass =
  'w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all'

export default function DeliverableDetailPage() {
  const { brandId, deliverableId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('copies')
  const [copyForm, setCopyForm] = useState({ title: '', content: '' })
  const [copyLoading, setCopyLoading] = useState(false)
  const [assetForm, setAssetForm] = useState({ title: '', link: '', assetType: 'other' })
  const [assetLoading, setAssetLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [deliverableId])

  async function fetchData() {
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}`)
      const d = await res.json()
      if (res.ok) {
        setData(d)
      } else {
        router.push(`/brands/${brandId}/deliverables`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function addCopy(e) {
    e.preventDefault()
    setCopyLoading(true)
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/copies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyForm),
      })
      const d = await res.json()
      if (res.ok) {
        setData((prev) => ({ ...prev, copies: [d.copy, ...prev.copies] }))
        setCopyForm({ title: '', content: '' })
      }
    } finally {
      setCopyLoading(false)
    }
  }

  async function deleteCopy(copyId) {
    await fetch(`/api/deliverables/${deliverableId}/copies/${copyId}`, {
      method: 'DELETE',
    })
    setData((prev) => ({
      ...prev,
      copies: prev.copies.filter((c) => c._id !== copyId),
    }))
  }

  async function addAsset(e) {
    e.preventDefault()
    setAssetLoading(true)
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetForm),
      })
      const d = await res.json()
      if (res.ok) {
        setData((prev) => ({ ...prev, assets: [d.asset, ...prev.assets] }))
        setAssetForm({ title: '', link: '', assetType: 'other' })
      }
    } finally {
      setAssetLoading(false)
    }
  }

  async function deleteAsset(assetId) {
    await fetch(`/api/deliverables/${deliverableId}/assets/${assetId}`, {
      method: 'DELETE',
    })
    setData((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a._id !== assetId),
    }))
  }

  async function deleteDeliverable() {
    setDeleting(true)
    try {
      await fetch(`/api/deliverables/${deliverableId}`, { method: 'DELETE' })
      router.push(`/brands/${brandId}/deliverables`)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-sm text-gray-400">
        Loading...
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { deliverable, copies, assets, adapts } = data
  const canCopy = session && canAddCopies(session.user.role)
  const canAsset = session && canAddAssets(session.user.role)
  const canDelete = session && canManageDeliverables(session.user.role)

  const tabs = [
    { id: 'copies', label: `Copies (${copies.length})` },
    { id: 'assets', label: `Assets (${assets.length})` },
    { id: 'adapts', label: `Adapts (${adapts.length})` },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <button
          onClick={() => router.push(`/brands/${brandId}/deliverables`)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 bg-transparent border-none cursor-pointer p-0 transition-colors"
        >
          ← Deliverables
        </button>

        {/* Header card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <span className="text-indigo-600 font-bold text-lg">
                  {deliverable.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {deliverable.name}
                  </h1>
                  <TypeBadge
                    type={deliverable.type}
                    customTypeName={deliverable.customTypeName}
                  />
                </div>
                {deliverable.description && (
                  <p className="text-sm text-gray-400">
                    {deliverable.description}
                  </p>
                )}
                {deliverable.parentDeliverableId && (
                  <p className="text-xs text-gray-400 mt-1">
                    Adapt of:{' '}
                    <span className="text-gray-600 font-medium">
                      {deliverable.parentDeliverableId.name}
                    </span>
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Added by {deliverable.createdBy?.name} ·{' '}
                  {new Date(deliverable.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {canDelete && (
              <button
                onClick={() => setShowDelete(true)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer transition-colors shrink-0"
              >
                Delete
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-none cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 bg-transparent hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Copies tab */}
        {activeTab === 'copies' && (
          <div className="flex flex-col gap-4">

            {canCopy && (
              <form
                onSubmit={addCopy}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3"
              >
                <p className="text-sm font-medium text-gray-700">Add copy</p>
                <input
                  type="text"
                  placeholder="Copy title e.g. Headline, Caption, CTA"
                  value={copyForm.title}
                  onChange={(e) => setCopyForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className={inputClass}
                />
                <textarea
                  placeholder="Copy content..."
                  rows={3}
                  value={copyForm.content}
                  onChange={(e) => setCopyForm((p) => ({ ...p, content: e.target.value }))}
                  className={`${inputClass} resize-none`}
                />
                <button
                  type="submit"
                  disabled={copyLoading}
                  className="self-end px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg border-none cursor-pointer transition-colors"
                >
                  {copyLoading ? 'Adding...' : 'Add copy'}
                </button>
              </form>
            )}

            {copies.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                <p className="text-sm text-gray-400">No copies yet.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {copies.map((copy) => (
                    <div key={copy._id} className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {copy.title}
                        </span>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-xs text-gray-400">
                            {copy.createdBy?.name}
                          </span>
                          {canCopy && (
                            <button
                              onClick={() => deleteCopy(copy._id)}
                              className="text-xs text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      {copy.content && (
                        <p className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
                          {copy.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Assets tab */}
        {activeTab === 'assets' && (
          <div className="flex flex-col gap-4">

            {canAsset && (
              <form
                onSubmit={addAsset}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3"
              >
                <p className="text-sm font-medium text-gray-700">Add asset link</p>
                <input
                  type="text"
                  placeholder="Asset title e.g. Final Cut v3"
                  value={assetForm.title}
                  onChange={(e) => setAssetForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className={inputClass}
                />
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={assetForm.link}
                  onChange={(e) => setAssetForm((p) => ({ ...p, link: e.target.value }))}
                  required
                  className={inputClass}
                />
                <select
                  value={assetForm.assetType}
                  onChange={(e) => setAssetForm((p) => ({ ...p, assetType: e.target.value }))}
                  className={inputClass}
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={assetLoading}
                  className="self-end px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg border-none cursor-pointer transition-colors"
                >
                  {assetLoading ? 'Adding...' : 'Add asset'}
                </button>
              </form>
            )}

            {assets.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                <p className="text-sm text-gray-400">No assets yet.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {assets.map((asset) => (
                    <div key={asset._id} className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {asset.title}
                        </div>                      
                         <a href={asset.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-500 hover:text-indigo-700 truncate block mt-0.5"
                        >
                          {asset.link}
                        </a>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {asset.uploadedBy?.name}
                      </span>
                      {canAsset && (
                        <button
                          onClick={() => deleteAsset(asset._id)}
                          className="text-xs text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer shrink-0"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Adapts tab */}
        {activeTab === 'adapts' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {adapts.length === 0 ? (
              <p className="p-10 text-center text-sm text-gray-400">
                No adapts linked to this deliverable.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {adapts.map((adapt) => (
                  <div
                    key={adapt._id}
                    onClick={() =>
                      router.push(`/brands/${brandId}/deliverables/${adapt._id}`)
                    }
                    className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {adapt.name}
                      </div>
                    </div>
                    <TypeBadge
                      type={adapt.type}
                      customTypeName={adapt.customTypeName}
                    />
                    <span className="text-gray-300">→</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Delete confirm modal — outside max-w container but inside outer div */}
      {showDelete && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
          onClick={(e) => e.target === e.currentTarget && setShowDelete(false)}
        >
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Delete deliverable
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This will also delete all copies and assets linked to{' '}
              <span className="font-medium text-gray-900">
                {deliverable.name}
              </span>
              . This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border-none cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteDeliverable}
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