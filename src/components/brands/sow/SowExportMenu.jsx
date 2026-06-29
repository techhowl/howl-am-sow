// src/components/brands/sow/SowExportMenu.jsx
'use client'

import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react'
import { exportSowCsv, exportSowPdf } from '@/lib/export/sowExport'

/**
 * Themed "Export" dropdown for the SOW table.
 * `getData()` returns the live { brandName, monthLabel, rows, totals } payload
 * at click-time so exports always reflect the current month / unsaved edits.
 */
export function SowExportMenu({ getData, disabled }) {
  const [open, setOpen] = useState(false)

  function run(fn) {
    try {
      fn(getData())
    } catch (err) {
      console.error('SOW export failed:', err)
    }
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="btn-ghost"
          aria-label="Export Scope of Work"
        >
          <Download size={14} aria-hidden="true" />
          Export
          <ChevronDown
            size={13}
            aria-hidden="true"
            className="transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="glass-thick z-50 min-w-[208px] rounded-[var(--radius-lg)] p-1.5"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <p className="eyebrow px-2.5 pb-1.5 pt-1" style={{ fontSize: 9 }}>
            Download as
          </p>

          <DropdownMenu.Item asChild>
            <button type="button" onClick={() => run(exportSowPdf)} className="export-item">
              <span className="export-ico" data-tone="pdf">
                <FileText size={15} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-foreground">PDF document</span>
                <span className="block text-[11px] text-muted-foreground">Formatted report with totals</span>
              </span>
            </button>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <button type="button" onClick={() => run(exportSowCsv)} className="export-item">
              <span className="export-ico" data-tone="csv">
                <FileSpreadsheet size={15} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-foreground">CSV spreadsheet</span>
                <span className="block text-[11px] text-muted-foreground">Raw rows for Excel / Sheets</span>
              </span>
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
