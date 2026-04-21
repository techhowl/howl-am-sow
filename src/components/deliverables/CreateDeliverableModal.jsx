'use client'

import { useState } from 'react'
import { DELIVERABLE_TYPES, TYPE_LABELS } from '@/lib/constants/deliverables'

export default function CreateDeliverableModal({
  onClose,
  onCreated,
  brandId,
  deliverables = [],
  customDeliverableTypes = [],
}) {
  const [form, setForm] = useState({
    name: '',
    type: 'video',
    customTypeName: '',
    parentDeliverableId: '',
    description: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isAdapt = form.type === 'video_adapt' || form.type === 'static_adapt'

  function handle(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/brands/${brandId}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          parentDeliverableId: form.parentDeliverableId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      onCreated(data.deliverable)
      onClose()
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">

        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Add deliverable
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Add a new deliverable to this brand
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-gray-100 border-none rounded-lg w-7 h-7 pb-2 cursor-pointer text-base"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Name
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Ramadan Hero Video"
              value={form.name}
              onChange={handle}
              className={inputClass}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Type
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handle}
              className={inputClass}
            >
              {DELIVERABLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
              {customDeliverableTypes.map((t) => (
                <option key={t} value="custom">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Custom type name */}
          {form.type === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Custom type name
              </label>
              <input
                name="customTypeName"
                type="text"
                required
                placeholder="e.g. Story Pack"
                value={form.customTypeName}
                onChange={handle}
                className={inputClass}
              />
            </div>
          )}

          {/* Parent deliverable (for adapts) */}
          {isAdapt && deliverables.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Adapt of
              </label>
              <select
                name="parentDeliverableId"
                value={form.parentDeliverableId}
                onChange={handle}
                className={inputClass}
              >
                <option value="">Select parent deliverable</option>
                {deliverables
                  .filter((d) => d.type === 'video' || d.type === 'static')
                  .map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Brief description..."
              value={form.description}
              onChange={handle}
              className={inputClass + ' resize-none'}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border-none cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg border-none cursor-pointer transition-colors"
            >
              {loading ? 'Adding...' : 'Add deliverable'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}