// src/components/brands/SOWTab.jsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Save, AlertTriangle, Check, Sparkles, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'

const FIXED_SOW_TYPES = [
  'Static', 'Static Adapt', 'Video', 'Video Adapt',
  'Reel', 'Carousel', 'GIF', 'Story', 'Performance Asset',
]

const iStyle = {
  border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827',
  fontSize: 13, padding: '7px 11px', fontFamily: 'inherit',
  boxSizing: 'border-box', outline: 'none', background: '#fff',
}

function formatINR(n) {
  if (n == null || isNaN(n)) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}
function formatUnits(n) {
  if (n == null || isNaN(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

export default function SOWTab({ brandId, canManage }) {
  const [month, setMonth]                     = useState(format(new Date(), 'yyyy-MM'))
  const [sowItems, setSowItems]               = useState([])
  const [carryOvers, setCarryOvers]           = useState([])
  const [suggestedCarryOvers, setSuggestedCarryOvers] = useState([])
  const [achievedByType, setAchievedByType]   = useState({})  // { typeName: count }
  const [loading, setLoading]                 = useState(true)
  const [saving, setSaving]                   = useState(false)
  const [saved, setSaved]                     = useState(false)
  const [error, setError]                     = useState('')
  const [customType, setCustomType]           = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
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
    const d = new Date(y, m - 2)
    setMonth(format(d, 'yyyy-MM'))
  }
  function nextMonth() {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m)
    setMonth(format(d, 'yyyy-MM'))
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
  function addCustom() {
    const t = customType.trim(); if (!t) return
    addType(t); setCustomType(''); setShowCustomInput(false)
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
      } else {
        return [...prev, {
          type: co.type,
          target: Math.max(0, co.amount),
          unitRate: co.suggestedUnitRate || 0,
          isCustom: !FIXED_SOW_TYPES.includes(co.type),
        }]
      }
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
    const variance       = deliveredValue - scopeValue
    return { ...item, achieved, scopeValue, deliveredValue, variance }
  })
  const totals = enrichedRows.reduce((acc, r) => ({
    units:     acc.units + (r.target || 0),
    scope:     acc.scope + r.scopeValue,
    delivered: acc.delivered + r.deliveredValue,
    variance:  acc.variance + r.variance,
  }), { units: 0, scope: 0, delivered: 0, variance: 0 })

  // Net carry-over impact (suggested money)
  const suggestedMoneyImpact = suggestedCarryOvers.reduce((s, co) => s + (co.moneyImpact || 0), 0)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Month navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Scope of Work</h2>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>Monthly scope &amp; delivery for {monthLabel}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <button onClick={prevMonth} style={{ padding: '7px 10px', border: 'none', background: '#fff', cursor: 'pointer', borderRight: '1px solid #e5e7eb', display: 'flex' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
          ><ChevronLeft size={15} color="#6b7280" /></button>
          <span style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#111827', minWidth: 130, textAlign: 'center' }}>
            {monthLabel}
          </span>
          <button onClick={nextMonth} style={{ padding: '7px 10px', border: 'none', background: '#fff', cursor: 'pointer', borderLeft: '1px solid #e5e7eb', display: 'flex' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
          ><ChevronRight size={15} color="#6b7280" /></button>
        </div>
      </div>

      {/* Top summary card */}
      {sowItems.length > 0 && (
        <div style={{ marginBottom: 20, padding: '14px 18px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: 12, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Scope Total</p>
              <p style={{ fontSize: 22, fontWeight: 700, margin: '2px 0 0' }}>{formatINR(totals.scope)}</p>
              <p style={{ fontSize: 10, opacity: 0.7, margin: '2px 0 0' }}>{formatUnits(totals.units)} deliverables scoped</p>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivered So Far</p>
              <p style={{ fontSize: 18, fontWeight: 600, margin: '2px 0 0' }}>{formatINR(totals.delivered)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variance</p>
              <p style={{
                fontSize: 18, fontWeight: 700, margin: '2px 0 0',
                color: totals.variance > 0 ? '#fef9c3' : totals.variance < 0 ? '#fecaca' : '#fff',
              }}>
                {totals.variance > 0 ? '+' : ''}{formatINR(totals.variance)}
              </p>
              <p style={{ fontSize: 10, opacity: 0.7, margin: '2px 0 0' }}>
                {totals.variance > 0 ? 'Overdelivered' : totals.variance < 0 ? 'Underdelivered' : 'On scope'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Carry-over suggestions */}
      {suggestedCarryOvers.length > 0 && canManage && (
        <div style={{ marginBottom: 20, border: '1px solid #fde68a', borderRadius: 12, overflow: 'hidden', background: '#fffbeb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} color="#d97706" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', margin: 0 }}>
                  Carry-over suggestions from last month
                </p>
                <p style={{ fontSize: 11, color: '#b45309', margin: '2px 0 0' }}>
                  Net impact:{' '}
                  <strong>{suggestedMoneyImpact > 0 ? '+' : ''}{formatINR(suggestedMoneyImpact)}</strong>
                  {' '}to next month&apos;s scope
                </p>
              </div>
            </div>
            <button onClick={acceptAllCarryOvers}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, border: '1px solid #d97706', borderRadius: 6, background: '#d97706', color: '#fff', cursor: 'pointer' }}>
              Accept all
            </button>
          </div>
          {suggestedCarryOvers.map((co) => (
            <div key={co.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 16px', borderBottom: '1px solid #fef3c7' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>
                  {co.type}
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: co.amount > 0 ? '#15803d' : '#dc2626' }}>
                    {co.amount > 0 ? '+' : ''}{formatUnits(co.amount)} units · {co.moneyImpact > 0 ? '+' : ''}{formatINR(co.moneyImpact)}
                  </span>
                </p>
                <p style={{ fontSize: 11, color: '#92400e', margin: '2px 0 0' }}>{co.note}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => acceptCarryOver(co)}
                  style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #d97706', borderRadius: 6, background: '#fff', color: '#d97706', cursor: 'pointer' }}>
                  Accept
                </button>
                <button onClick={() => ignoreCarryOver(co.type)}
                  style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', color: '#6b7280', cursor: 'pointer' }}>
                  Ignore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmed carry-overs */}
      {carryOvers.filter((c) => c.confirmedByAM).length > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#15803d', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applied Carry-overs</p>
          {carryOvers.filter((c) => c.confirmedByAM).map((co) => (
            <p key={co.type} style={{ fontSize: 12, color: '#166534', margin: '2px 0' }}>
              • {co.type}: {co.amount > 0 ? '+' : ''}{formatUnits(co.amount)} units ({co.moneyImpact > 0 ? '+' : ''}{formatINR(co.moneyImpact || 0)}) from {co.fromMonth}
            </p>
          ))}
        </div>
      )}

      {/* Add types */}
      {canManage && unusedFixed.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Add Content Types</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {unusedFixed.map((type) => (
              <button key={type} type="button" onClick={() => addType(type)}
                style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 99, background: '#fff', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.background = '#eef2ff' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = '#fff' }}
              ><Plus size={10} />{type}</button>
            ))}
            <button type="button" onClick={() => setShowCustomInput(true)}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px dashed #c4b5fd', borderRadius: 99, background: '#faf5ff', color: '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            ><Sparkles size={10} />Custom</button>
          </div>
        </div>
      )}

      {showCustomInput && canManage && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input autoFocus value={customType} onChange={(e) => setCustomType(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="Custom type name..." style={{ ...iStyle, flex: 1 }}
            onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)' }}
            onBlur={(e)  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
          />
          <button onClick={addCustom} style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 8, background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>Add</button>
          <button onClick={() => { setShowCustomInput(false); setCustomType('') }} style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {/* SOW table */}
      {sowItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', background: '#f9fafb', borderRadius: 12, border: '2px dashed #e5e7eb' }}>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No SOW defined for {monthLabel}</p>
          {canManage && <p style={{ fontSize: 11, color: '#c4c4c4', margin: '4px 0 0' }}>Add content types above to define the scope</p>}
        </div>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: canManage
              ? '1.4fr 70px 70px 90px 110px 110px 110px 36px'
              : '1.4fr 70px 70px 90px 110px 110px 110px',
            padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', gap: 6,
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Particulars</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'center' }}>Scope</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'center' }}>Delivered</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'center' }}>Unit ₹</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'right' }}>Scope ₹</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'right' }}>Delivered ₹</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'right' }}>Variance</p>
            {canManage && <div />}
          </div>

          {/* Rows */}
          {enrichedRows.map((row, idx) => {
            const varColor = row.variance > 0 ? '#15803d' : row.variance < 0 ? '#dc2626' : '#6b7280'
            const varBg    = row.variance > 0 ? '#f0fdf4' : row.variance < 0 ? '#fef2f2' : 'transparent'
            return (
              <div key={row.type} style={{
                display: 'grid',
                gridTemplateColumns: canManage
                  ? '1.4fr 70px 70px 90px 110px 110px 110px 36px'
                  : '1.4fr 70px 70px 90px 110px 110px 110px',
                padding: '10px 12px', alignItems: 'center', gap: 6,
                borderBottom: idx < enrichedRows.length - 1 ? '1px solid #f3f4f6' : 'none',
                background: '#fff',
              }}>
                {/* Type */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.type}>{row.type}</p>
                  {row.isCustom && <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 99, background: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff', flexShrink: 0 }}>NEW</span>}
                </div>

                {/* Scope (target) */}
                {canManage ? (
                  <input type="number" step="0.01" min="0" value={row.target}
                    onChange={(e) => updateTarget(row.type, e.target.value)}
                    style={{ width: '100%', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 4px', fontSize: 12, fontWeight: 600, color: '#111827', fontFamily: 'inherit', outline: 'none' }}
                  />
                ) : (
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, textAlign: 'center' }}>{formatUnits(row.target)}</p>
                )}

                {/* Delivered (read-only, comes from task data) */}
                <p style={{ fontSize: 13, fontWeight: 600, color: row.achieved >= row.target ? '#15803d' : '#374151', margin: 0, textAlign: 'center' }}>
                  {formatUnits(row.achieved)}
                </p>

                {/* Unit rate */}
                {canManage ? (
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#9ca3af' }}>₹</span>
                    <input
                      type="number" min="0" value={row.unitRate || 0}
                      onChange={(e) => updateUnitRate(row.type, e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', textAlign: 'center', paddingLeft: 14, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 4px 4px 14px', fontSize: 12, color: '#111827', fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0, textAlign: 'center' }}>{formatINR(row.unitRate)}</p>
                )}

                {/* Scope ₹ */}
                <p style={{ fontSize: 12, fontWeight: 600, color: row.scopeValue > 0 ? '#111827' : '#d1d5db', margin: 0, textAlign: 'right' }}>{formatINR(row.scopeValue)}</p>

                {/* Delivered ₹ */}
                <p style={{ fontSize: 12, fontWeight: 600, color: row.deliveredValue > 0 ? '#111827' : '#d1d5db', margin: 0, textAlign: 'right' }}>{formatINR(row.deliveredValue)}</p>

                {/* Variance */}
                <p style={{ fontSize: 12, fontWeight: 700, color: varColor, margin: 0, textAlign: 'right', padding: '2px 6px', background: varBg, borderRadius: 4 }}>
                  {row.variance > 0 ? '+' : ''}{formatINR(row.variance)}
                </p>

                {canManage && (
                  <button onClick={() => removeItem(row.type)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d1d5db' }}
                  ><Trash2 size={12} /></button>
                )}
              </div>
            )
          })}

          {/* Totals row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: canManage
              ? '1.4fr 70px 70px 90px 110px 110px 110px 36px'
              : '1.4fr 70px 70px 90px 110px 110px 110px',
            padding: '11px 12px', background: '#f9fafb', borderTop: '2px solid #e5e7eb', gap: 6, alignItems: 'center',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>Grand Total</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0, textAlign: 'center' }}>{formatUnits(totals.units)}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0, textAlign: 'center' }}>—</p>
            <div />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5', margin: 0, textAlign: 'right' }}>{formatINR(totals.scope)}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5', margin: 0, textAlign: 'right' }}>{formatINR(totals.delivered)}</p>
            <p style={{
              fontSize: 13, fontWeight: 700, margin: 0, textAlign: 'right',
              color: totals.variance > 0 ? '#15803d' : totals.variance < 0 ? '#dc2626' : '#374151',
              padding: '3px 6px', borderRadius: 4,
              background: totals.variance > 0 ? '#dcfce7' : totals.variance < 0 ? '#fee2e2' : 'transparent',
              display: 'inline-flex', alignItems: 'center', gap: 3, justifySelf: 'end',
            }}>
              {totals.variance > 0 ? <TrendingUp size={11} /> : totals.variance < 0 ? <TrendingDown size={11} /> : null}
              {totals.variance > 0 ? '+' : ''}{formatINR(totals.variance)}
            </p>
            {canManage && <div />}
          </div>
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>{error}</p>}

      {canManage && sowItems.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleSave} disabled={saving || !isDirty}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 8, background: (!isDirty || saving) ? '#c7d2fe' : '#4f46e5', color: '#fff', cursor: (!isDirty || saving) ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease' }}
          >
            {saving ? 'Saving...' : <><Save size={14} />Save SOW</>}
          </button>
          {saved && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#15803d', fontWeight: 500 }}>
              <Check size={14} color="#15803d" />Saved!
            </span>
          )}
          {isDirty && !saving && (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Unsaved changes</span>
          )}
        </div>
      )}
    </div>
  )
}