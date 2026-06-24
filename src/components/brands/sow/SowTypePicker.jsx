'use client'

import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'

/** Add-content-type chips + inline custom-type input. */
export function SowTypePicker({ unusedFixed, onAdd }) {
  const [customType, setCustomType] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  function addCustom() {
    const t = customType.trim()
    if (!t) return
    onAdd(t)
    setCustomType('')
    setShowCustom(false)
  }

  return (
    <div className="mb-4">
      <p className="eyebrow mb-2">Add content types</p>
      <div className="flex flex-wrap gap-2">
        {unusedFixed.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="chip cursor-pointer hover:text-primary"
          >
            <Plus size={11} aria-hidden="true" />
            {type}
          </button>
        ))}
        {!showCustom && (
          <button
            type="button"
            data-tone="primary"
            onClick={() => setShowCustom(true)}
            className="chip cursor-pointer"
          >
            <Sparkles size={11} aria-hidden="true" />
            Custom
          </button>
        )}
      </div>

      {showCustom && (
        <div className="mt-2 flex gap-2">
          <input
            autoFocus
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="Custom type name…"
            aria-label="Custom content type name"
            className="input flex-1"
          />
          <button onClick={addCustom} className="btn-primary">Add</button>
          <button
            onClick={() => {
              setShowCustom(false)
              setCustomType('')
            }}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
