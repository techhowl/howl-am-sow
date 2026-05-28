// src/components/brands/CreateBrandModal.jsx
'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react'

const COLORS = [
  '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
  '#d97706', '#16a34a', '#0891b2', '#0f172a',
]

const FIXED_SOW_TYPES = [
  'Static', 'Static Adapt', 'Video', 'Video Adapt',
  'Reel', 'Carousel', 'GIF', 'Story', 'Performance Asset',
]

const STEP_LABELS = ['Brand Details', 'Scope of Work', 'Add Members']

const iStyle = {
  width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827',
  fontSize: 13, padding: '8px 12px', fontFamily: 'inherit', boxSizing: 'border-box',
  outline: 'none', background: '#fff',
}

const btnStyle = (bg, color) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', fontSize: 13, fontWeight: 500,
  borderRadius: 8, border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', background: bg, color,
  transition: 'all 0.15s ease',
})

function formatINR(n) {
  if (n == null || isNaN(n)) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}
function formatUnits(n) {
  if (n == null || isNaN(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function StepBar({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {STEP_LABELS.map((label, i) => {
        const done = i < step; const cur = i === step
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: done ? '#4f46e5' : cur ? '#eef2ff' : '#f3f4f6',
                color: done ? '#fff' : cur ? '#4f46e5' : '#9ca3af',
                border: cur ? '2px solid #4f46e5' : '2px solid transparent',
              }}>
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: cur ? 600 : 400, color: cur ? '#111827' : done ? '#4f46e5' : '#9ca3af', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: done ? '#4f46e5' : '#e5e7eb', margin: '0 12px' }} />}
          </div>
        )
      })}
    </div>
  )
}

function Step1({ form, setForm }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Brand Name *</label>
        <input
          autoFocus type="text" value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Nike, NCPA, Dove" style={iStyle}
          onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)' }}
          onBlur={(e)  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Brand Color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setForm((p) => ({ ...p, color: c }))}
              style={{ width: 28, height: 28, borderRadius: 6, background: c, border: 'none', cursor: 'pointer', padding: 0, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: 2, transform: form.color === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s ease' }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
          {form.name ? form.name[0].toUpperCase() : '?'}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{form.name || 'Brand name'}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Preview</p>
        </div>
      </div>
    </div>
  )
}

function Step2({ sowItems, setSowItems }) {
  const [customType, setCustomType]           = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  function addType(type) {
    if (sowItems.find((i) => i.type === type)) return
    setSowItems((prev) => [...prev, {
      type, target: 1, unitRate: 0,
      isCustom: !FIXED_SOW_TYPES.includes(type),
    }])
  }
  function removeItem(type) { setSowItems((prev) => prev.filter((i) => i.type !== type)) }
  function updateTarget(type, val) {
    let num = parseFloat(val)
    if (isNaN(num) || num < 0) num = 0
    setSowItems((prev) => prev.map((i) => i.type === type ? { ...i, target: num } : i))
  }
  function updateUnitRate(type, val) {
    const num = val === '' ? 0 : Math.max(0, parseInt(val) || 0)
    setSowItems((prev) => prev.map((i) => i.type === type ? { ...i, unitRate: num } : i))
  }
  function addCustom() {
    const t = customType.trim(); if (!t) return
    addType(t); setCustomType(''); setShowCustomInput(false)
  }

  const usedTypes   = new Set(sowItems.map((i) => i.type))
  const unusedFixed = FIXED_SOW_TYPES.filter((t) => !usedTypes.has(t))
  const totalUnits  = sowItems.reduce((s, i) => s + (i.target || 0), 0)
  const totalScope  = sowItems.reduce((s, i) => s + (i.target || 0) * (i.unitRate || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
        Define monthly targets and rate per unit. Decimal targets are allowed (e.g. 0.33 for once-per-quarter items).
      </p>

      {unusedFixed.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Add Content Types</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {unusedFixed.map((type) => (
              <button key={type} type="button" onClick={() => addType(type)}
                style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: 99, background: '#fff', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.background = '#eef2ff' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = '#fff' }}
              >
                <Plus size={10} />{type}
              </button>
            ))}
            <button type="button" onClick={() => setShowCustomInput(true)}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px dashed #c4b5fd', borderRadius: 99, background: '#faf5ff', color: '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Sparkles size={10} />Custom type
            </button>
          </div>
        </div>
      )}

      {showCustomInput && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input autoFocus value={customType} onChange={(e) => setCustomType(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="e.g. Reels & Videos (30-45 sec), Job Postings..."
            style={{ ...iStyle, flex: 1 }}
            onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)' }}
            onBlur={(e)  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
          />
          <button type="button" onClick={addCustom} style={{ ...btnStyle('#4f46e5', '#fff'), padding: '8px 14px' }}>Add</button>
          <button type="button" onClick={() => { setShowCustomInput(false); setCustomType('') }} style={{ ...btnStyle('#f3f4f6', '#374151'), padding: '8px 14px' }}>Cancel</button>
        </div>
      )}

      {sowItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f9fafb', borderRadius: 12, border: '2px dashed #e5e7eb' }}>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No content types added yet</p>
          <p style={{ fontSize: 11, color: '#c4c4c4', margin: '4px 0 0' }}>Click a type above to add it to the SOW</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px 36px', padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Type</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'center' }}>Scope</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'center' }}>Unit ₹</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'right' }}>Total ₹</p>
            <div />
          </div>
          {/* Rows */}
          {sowItems.map((item, idx) => {
            const lineTotal = (item.target || 0) * (item.unitRate || 0)
            return (
              <div key={item.type} style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px 36px',
                padding: '9px 12px', alignItems: 'center', gap: 8,
                borderBottom: idx < sowItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                background: '#fff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.type}>{item.type}</p>
                  {item.isCustom && <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 99, background: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff', flexShrink: 0 }}>NEW</span>}
                </div>
                <input
                  type="number" step="0.01" min="0" value={item.target}
                  onChange={(e) => updateTarget(item.type, e.target.value)}
                  style={{ width: '100%', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 6px', fontSize: 12, fontWeight: 600, color: '#111827', fontFamily: 'inherit', outline: 'none' }}
                />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#9ca3af' }}>₹</span>
                  <input
                    type="number" min="0" value={item.unitRate || 0}
                    onChange={(e) => updateUnitRate(item.type, e.target.value)}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'center', paddingLeft: 18, border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 6px 5px 18px', fontSize: 12, color: '#111827', fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: lineTotal > 0 ? '#111827' : '#d1d5db', margin: 0, textAlign: 'right' }}>{formatINR(lineTotal)}</p>
                <button type="button" onClick={() => removeItem(item.type)}
                  style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d1d5db' }}
                ><Trash2 size={12} /></button>
              </div>
            )
          })}
          {/* Footer total */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px 36px', padding: '10px 12px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', gap: 8, alignItems: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>Monthly Scope Total</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: 0, textAlign: 'center' }}>{formatUnits(totalUnits)}</p>
            <div />
            <p style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5', margin: 0, textAlign: 'right' }}>{formatINR(totalScope)}</p>
            <div />
          </div>
        </div>
      )}
    </div>
  )
}

function Step3({ selectedMembers, setSelectedMembers }) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    fetch('/api/users').then((r) => r.json()).then((d) => {
      setUsers(d.users?.filter((u) => u.isActive) || [])
      setLoading(false)
    })
  }, [])

  function toggle(id) {
    setSelectedMembers((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  }

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
        Add team members to this brand. You can always add or remove members later from the brand page.
      </p>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search team members..."
        style={iStyle}
        onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)' }}
        onBlur={(e)  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
      />

      {loading ? (
        <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: 16 }}>Loading team...</p>
      ) : (
        // FIX: Previously had both `overflowY: 'auto'` AND `overflow: 'hidden'` on the
        // same div — the shorthand `overflow: hidden` came after and clobbered the
        // axis-specific rule, so the list got clipped and no scrollbar showed up.
        // Now only `overflowY: 'auto'` is set, plus `overscrollBehavior: 'contain'`
        // so the inner scroll doesn't chain into the page behind the modal.
        <div
          style={{
            maxHeight: 320,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            background: '#fff',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {filtered.map((user, idx) => {
            const sel      = selectedMembers.includes(user._id)
            const initials = user.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
            return (
              <div key={user._id} onClick={() => toggle(user._id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', background: sel ? '#eef2ff' : '#fff', transition: 'background 0.1s' }}
                onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = '#f9fafb' }}
                onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = '#fff' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: sel ? '#4f46e5' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sel ? '#fff' : '#6b7280', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>{user.name}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: '1px 0 0', textTransform: 'capitalize' }}>{user.role?.replace(/_/g, ' ')}</p>
                </div>
                {sel && <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={11} color="#fff" /></div>}
              </div>
            )
          })}
          {filtered.length === 0 && <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: '24px 16px' }}>No members found</p>}
        </div>
      )}

      {selectedMembers.length > 0 && (
        <p style={{ fontSize: 12, color: '#4f46e5', fontWeight: 500, margin: 0 }}>
          {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}

export default function CreateBrandModal({ onClose, onCreated }) {
  const [step, setStep]                       = useState(0)
  const [form, setForm]                       = useState({ name: '', color: COLORS[0] })
  const [sowItems, setSowItems]               = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [error, setError]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [mounted, setMounted]                 = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const canNext = step === 0 ? form.name.trim().length > 0 : true

  async function handleFinish() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/brands', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          color: form.color,
          sowItems,
          memberIds: selectedMembers,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      onCreated(data.brand); onClose()
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  if (!mounted) return null

  return createPortal(
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 16 }}
    >
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, boxShadow: '0 25px 80px rgba(0,0,0,0.15)', width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: '24px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Create Brand</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>Step {step + 1} of 3 — {STEP_LABELS[step]}</p>
            </div>
            <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            ><X size={18} /></button>
          </div>
          <StepBar step={step} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 16px' }}>
          {step === 0 && <Step1 form={form} setForm={setForm} />}
          {step === 1 && <Step2 sowItems={sowItems} setSowItems={setSowItems} />}
          {step === 2 && <Step3 selectedMembers={selectedMembers} setSelectedMembers={setSelectedMembers} />}
        </div>

        {error && (
          <div style={{ margin: '0 24px 8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
          {step > 0
            ? <button type="button" onClick={() => setStep((s) => s - 1)} style={btnStyle('#f3f4f6', '#374151')}><ChevronLeft size={14} />Back</button>
            : <button type="button" onClick={onClose} style={btnStyle('#f3f4f6', '#374151')}>Cancel</button>
          }
          {step < 2
            ? <button type="button" onClick={() => { setError(''); setStep((s) => s + 1) }} disabled={!canNext}
                style={{ ...btnStyle(canNext ? '#4f46e5' : '#c7d2fe', '#fff'), cursor: canNext ? 'pointer' : 'not-allowed' }}>
                Next<ChevronRight size={14} />
              </button>
            : <button type="button" onClick={handleFinish} disabled={loading}
                style={{ ...btnStyle(loading ? '#818cf8' : '#4f46e5', '#fff'), cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Creating...' : '🎉 Create Brand'}
              </button>
          }
        </div>
      </div>
    </div>,
    document.body
  )
}