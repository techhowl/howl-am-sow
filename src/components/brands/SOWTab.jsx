// src/components/brands/SOWTab.jsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Save, Check, FileText } from 'lucide-react'
import { FIXED_SOW_TYPES } from './sow/sowFormat'
import { SowMonthNav } from './sow/SowMonthNav'
import { SowSummaryCard } from './sow/SowSummaryCard'
import { SowCarryOverPanel } from './sow/SowCarryOverPanel'
import { SowTypePicker } from './sow/SowTypePicker'
import { SowTable } from './sow/SowTable'
import { SowExportMenu } from './sow/SowExportMenu'

export default function SOWTab({ brandId, canManage, brandName }) {
  const [month, setMonth]                     = useState(format(new Date(), 'yyyy-MM'))
  const [sowItems, setSowItems]               = useState([])
  const [carryOvers, setCarryOvers]           = useState([])
  const [suggestedCarryOvers, setSuggestedCarryOvers] = useState([])
  const [achievedByType, setAchievedByType]   = useState({})  // { typeName: count }
  const [loading, setLoading]                 = useState(true)
  const [saving, setSaving]                   = useState(false)
  const [saved, setSaved]                     = useState(false)
  const [error, setError]                     = useState('')
  const [isDirty, setIsDirty]                 = useState(false)

  const fetchSOW = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/brands/${brandId}/sow?month=${month}`)
      const data = await res.json()
      if (data.sow) {
        setSowItems(data.sow.items || [])
        setCarryOvers(data.sow.carryOvers || [])
        setSuggestedCarryOvers([])
      } else if (data.baseline) {
        setSowItems(data.baseline)
        setCarryOvers([])
        setSuggestedCarryOvers(data.suggestedCarryOvers || [])
      } else {
        setSowItems([])
        setCarryOvers([])
        setSuggestedCarryOvers([])
      }
      setAchievedByType(data.achievedByType || {})
      setIsDirty(false)
    } finally {
      setLoading(false)
    }
  }, [brandId, month])

  useEffect(() => { fetchSOW() }, [fetchSOW])

  function prevMonth() {
    const [y, m] = month.split('-').map(Number)
    setMonth(format(new Date(y, m - 2), 'yyyy-MM'))
  }
  function nextMonth() {
    const [y, m] = month.split('-').map(Number)
    setMonth(format(new Date(y, m), 'yyyy-MM'))
  }

  function addType(type) {
    if (sowItems.find((i) => i.type === type)) return
    setSowItems((p) => [...p, {
      type, target: 1, unitRate: 0,
      isCustom: !FIXED_SOW_TYPES.includes(type),
    }])
    setIsDirty(true)
  }
  function removeItem(type) {
    setSowItems((p) => p.filter((i) => i.type !== type))
    setIsDirty(true)
  }
  function updateTarget(type, val) {
    let num = parseFloat(val)
    if (isNaN(num) || num < 0) num = 0
    setSowItems((p) => p.map((i) => i.type === type ? { ...i, target: num } : i))
    setIsDirty(true)
  }
  function updateUnitRate(type, val) {
    const num = val === '' ? 0 : Math.max(0, parseInt(val) || 0)
    setSowItems((p) => p.map((i) => i.type === type ? { ...i, unitRate: num } : i))
    setIsDirty(true)
  }

  function acceptCarryOver(co) {
    setSowItems((prev) => {
      const existing = prev.find((i) => i.type === co.type)
      if (existing) {
        return prev.map((i) =>
          i.type === co.type
            ? { ...i, target: Math.max(0, (i.target || 0) + co.amount) }
            : i
        )
      }
      return [...prev, {
        type: co.type,
        target: Math.max(0, co.amount),
        unitRate: co.suggestedUnitRate || 0,
        isCustom: !FIXED_SOW_TYPES.includes(co.type),
      }]
    })
    setCarryOvers((p) => [...p, { ...co, confirmedByAM: true }])
    setSuggestedCarryOvers((p) => p.filter((s) => s.type !== co.type))
    setIsDirty(true)
  }
  function acceptAllCarryOvers() {
    suggestedCarryOvers.forEach(acceptCarryOver)
  }
  function ignoreCarryOver(type) {
    setSuggestedCarryOvers((p) => p.filter((s) => s.type !== type))
  }

  async function handleSave() {
    if (!sowItems.length) { setError('Add at least one content type'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/brands/${brandId}/sow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, items: sowItems, carryOvers }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }
      setSaved(true); setIsDirty(false)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  const usedTypes   = new Set(sowItems.map((i) => i.type))
  const unusedFixed = FIXED_SOW_TYPES.filter((t) => !usedTypes.has(t))
  const monthLabel  = format(new Date(`${month}-01`), 'MMMM yyyy')

  // Per-row + totals math
  const enrichedRows = sowItems.map((item) => {
    const achieved       = achievedByType[item.type] || 0
    const scopeValue     = (item.target || 0) * (item.unitRate || 0)
    const deliveredValue = achieved * (item.unitRate || 0)
    return { ...item, achieved, scopeValue, deliveredValue, variance: deliveredValue - scopeValue }
  })
  const totals = enrichedRows.reduce((acc, r) => ({
    units:     acc.units + (r.target || 0),
    scope:     acc.scope + r.scopeValue,
    delivered: acc.delivered + r.deliveredValue,
    variance:  acc.variance + r.variance,
  }), { units: 0, scope: 0, delivered: 0, variance: 0 })

  const suggestedMoneyImpact = suggestedCarryOvers.reduce((s, co) => s + (co.moneyImpact || 0), 0)

  return (
    <div className="max-w-3xl">
      {/* Header + month navigator */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Scope of Work</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Monthly scope &amp; delivery for {monthLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SowExportMenu
            disabled={loading || enrichedRows.length === 0}
            getData={() => ({ brandName, monthLabel, rows: enrichedRows, totals })}
          />
          <SowMonthNav monthLabel={monthLabel} onPrev={prevMonth} onNext={nextMonth} />
        </div>
      </div>

      {loading ? (
        <SowSkeleton />
      ) : (
        <>
          {sowItems.length > 0 && <SowSummaryCard totals={totals} />}

          <SowCarryOverPanel
            suggested={suggestedCarryOvers}
            confirmed={carryOvers}
            netImpact={suggestedMoneyImpact}
            canManage={canManage}
            onAccept={acceptCarryOver}
            onAcceptAll={acceptAllCarryOvers}
            onIgnore={ignoreCarryOver}
          />

          {canManage && <SowTypePicker unusedFixed={unusedFixed} onAdd={addType} />}

          {sowItems.length === 0 ? (
            <div className="surface-card flex flex-col items-center justify-center px-6 py-12 text-center">
              <span className="empty-art mb-4">
                <FileText size={26} aria-hidden="true" />
              </span>
              <p className="text-[13px] font-medium text-foreground">No SOW defined for {monthLabel}</p>
              {canManage && (
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Add content types above to define the scope
                </p>
              )}
            </div>
          ) : (
            <SowTable
              rows={enrichedRows}
              totals={totals}
              canManage={canManage}
              onUpdateTarget={updateTarget}
              onUpdateRate={updateUnitRate}
              onRemove={removeItem}
            />
          )}

          {error && (
            <p
              className="mb-3 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-[12px]"
              style={{
                color: 'var(--destructive)',
                background: 'color-mix(in oklab, var(--destructive) 10%, transparent)',
                borderColor: 'color-mix(in oklab, var(--destructive) 30%, transparent)',
              }}
            >
              {error}
            </p>
          )}

          {canManage && sowItems.length > 0 && (
            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={saving || !isDirty} className="btn-primary">
                {saving ? 'Saving…' : (<><Save size={14} aria-hidden="true" />Save SOW</>)}
              </button>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-success">
                  <Check size={14} aria-hidden="true" />Saved!
                </span>
              )}
              {isDirty && !saving && (
                <span className="text-[11px] text-muted-foreground">Unsaved changes</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Shimmer placeholder that reserves the table's height (no content jump). */
function SowSkeleton() {
  return (
    <div>
      <div className="skeleton mb-5 h-[120px] w-full rounded-[var(--radius-xl)]" />
      <div className="surface-card overflow-hidden p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-12" />
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
