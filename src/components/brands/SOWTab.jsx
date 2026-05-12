// src/components/brands/SOWTab.jsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Save, AlertTriangle, Check, Sparkles, ChevronLeft, ChevronRight, Info } from 'lucide-react'

const FIXED_SOW_TYPES = [
  'Static', 'Static Adapt', 'Video', 'Video Adapt',
  'Reel', 'Carousel', 'GIF', 'Story', 'Performance Asset',
]

const iStyle = {
  border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827',
  fontSize: 13, padding: '7px 11px', fontFamily: 'inherit',
  boxSizing: 'border-box', outline: 'none', background: '#fff',
}

export default function SOWTab({ brandId, canManage }) {
  const [month, setMonth]                     = useState(format(new Date(), 'yyyy-MM'))
  const [sowItems, setSowItems]               = useState([])
  const [carryOvers, setCarryOvers]           = useState([])
  const [suggestedCarryOvers, setSuggestedCarryOvers] = useState([])
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
        // No SOW yet — use last month's as baseline
        setSowItems(data.baseline)
        setCarryOvers([])
        setSuggestedCarryOvers(data.suggestedCarryOvers || [])
      } else {
        setSowItems([])
        setCarryOvers([])
        setSuggestedCarryOvers([])
      }
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
    setSowItems((p) => [...p, { type, target: 1, isCustom: !FIXED_SOW_TYPES.includes(type) }])
    setIsDirty(true)
  }
  function removeItem(type) {
    setSowItems((p) => p.filter((i) => i.type !== type))
    setIsDirty(true)
  }
  function updateTarget(type, val) {
    const num = Math.max(0, parseInt(val) || 0)
    setSowItems((p) => p.map((i) => i.type === type ? { ...i, target: num } : i))
    setIsDirty(true)
  }
  function addCustom() {
    const t = customType.trim(); if (!t) return
    addType(t); setCustomType(''); setShowCustomInput(false)
  }

  function acceptCarryOver(co) {
    // Apply carry-over: adjust the target for that type
    setSowItems((prev) => {
      const existing = prev.find((i) => i.type === co.type)
      if (existing) {
        return prev.map((i) =>
          i.type === co.type
            ? { ...i, target: Math.max(0, i.target + co.amount) }
            : i
        )
      } else {
        return [...prev, { type: co.type, target: Math.max(0, co.amount), isCustom: !FIXED_SOW_TYPES.includes(co.type) }]
      }
    })
    const confirmed = { ...co, confirmedByAM: true }
    setCarryOvers((p) => [...p, confirmed])
    setSuggestedCarryOvers((p) => p.filter((s) => s.type !== co.type))
    setIsDirty(true)
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
  const totalSOW    = sowItems.reduce((s, i) => s + i.target, 0)
  const monthLabel  = format(new Date(`${month}-01`), 'MMMM yyyy')

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>

      {/* Month navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Scope of Work</h2>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>Monthly targets for {monthLabel}</p>
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

      {/* Carry-over suggestions */}
      {suggestedCarryOvers.length > 0 && canManage && (
        <div style={{ marginBottom: 20, border: '1px solid #fde68a', borderRadius: 12, overflow: 'hidden', background: '#fffbeb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #fde68a' }}>
            <AlertTriangle size={15} color="#d97706" />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', margin: 0 }}>
              Carry-over suggestions from last month
            </p>
          </div>
          {suggestedCarryOvers.map((co) => (
            <div key={co.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 16px', borderBottom: '1px solid #fef3c7' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{co.type}</p>
                <p style={{ fontSize: 11, color: '#92400e', margin: '2px 0 0' }}>{co.note}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, shrink: 0 }}>
                <button onClick={() => acceptCarryOver(co)}
                  style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #d97706', borderRadius: 6, background: '#d97706', color: '#fff', cursor: 'pointer' }}
                >
                  Accept
                </button>
                <button onClick={() => ignoreCarryOver(co.type)}
                  style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', color: '#6b7280', cursor: 'pointer' }}
                >
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
              • {co.type}: {co.amount > 0 ? '+' : ''}{co.amount} from {co.fromMonth}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 40px', padding: '8px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Content Type</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Monthly Target</p>
            {canManage && <div />}
          </div>

          {sowItems.map((item, idx) => (
            <div key={item.type} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 40px', padding: '11px 14px', alignItems: 'center', borderBottom: idx < sowItems.length - 1 ? '1px solid #f3f4f6' : 'none', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>{item.type}</p>
                {item.isCustom && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 99, background: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}>CUSTOM</span>}
              </div>
              {canManage ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => updateTarget(item.type, item.target - 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>−</button>
                  <input type="number" min="0" value={item.target} onChange={(e) => updateTarget(item.type, e.target.value)}
                    style={{ width: 52, textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 6px', fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'inherit', outline: 'none' }}
                  />
                  <button onClick={() => updateTarget(item.type, item.target + 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>+</button>
                </div>
              ) : (
                <p style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5', margin: 0 }}>{item.target}</p>
              )}
              {canManage && (
                <button onClick={() => removeItem(item.type)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d1d5db' }}
                ><Trash2 size={13} /></button>
              )}
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 40px', padding: '10px 14px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>Total SOW</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#4f46e5', margin: 0 }}>{totalSOW} deliverables</p>
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