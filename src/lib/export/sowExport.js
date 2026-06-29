// src/lib/export/sowExport.js
// SOW export helpers — CSV (native, UTF-8 + BOM) and PDF (jsPDF + autoTable).
// Consumed by SOWTab's export buttons. Keep number/label shape in sync with
// the SOW table (Particulars, Scope, Delivered, Unit ₹, Scope ₹, Delivered ₹, Variance).

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatUnits } from '@/components/brands/sow/sowFormat'

// Violet brand theme mapped to print-safe RGB (oklch tokens won't render in PDF).
const THEME = {
  primary:   [124, 58, 237],   // --primary violet
  primaryHi: [139, 92, 246],
  ink:       [45, 38, 64],     // --foreground
  muted:     [107, 101, 128],  // --muted-foreground
  success:   [15, 169, 122],   // --success
  danger:    [220, 38, 38],    // --destructive
  rule:      [228, 224, 240],
  zebra:     [248, 246, 252],
}

// ── Formatters ────────────────────────────────────────────────────────
// jsPDF's core Helvetica has no ₹ glyph → use "Rs" in PDF, real ₹ in CSV.
function inrPdf(n) {
  if (n == null || isNaN(n)) return 'Rs 0'
  const v = Math.round(n)
  return (v < 0 ? '-Rs ' : 'Rs ') + Math.abs(v).toLocaleString('en-IN')
}
function inrCsv(n) {
  if (n == null || isNaN(n)) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}
function signed(fmt, n) {
  if (!n) return fmt(0)
  return n > 0 ? '+' + fmt(n) : fmt(n)
}

function safeFile(s) {
  return String(s || 'sow').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
}

// Normalise the SOWTab payload into a single shape both exporters read.
function buildModel({ brandName, monthLabel, rows, totals }) {
  return {
    brandName: brandName || 'Brand',
    monthLabel: monthLabel || '',
    generatedAt: new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
    rows: (rows || []).map((r) => ({
      type: r.type,
      target: r.target || 0,
      achieved: r.achieved || 0,
      unitRate: r.unitRate || 0,
      scopeValue: r.scopeValue || 0,
      deliveredValue: r.deliveredValue || 0,
      variance: r.variance || 0,
    })),
    totals: {
      units: totals?.units || 0,
      scope: totals?.scope || 0,
      delivered: totals?.delivered || 0,
      variance: totals?.variance || 0,
    },
  }
}

// ── CSV ───────────────────────────────────────────────────────────────
function csvCell(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportSowCsv(input) {
  const m = buildModel(input)
  const lines = []

  // Metadata block
  lines.push(['Scope of Work'])
  lines.push(['Brand', m.brandName])
  lines.push(['Month', m.monthLabel])
  lines.push(['Generated', m.generatedAt])
  lines.push([])

  // Table
  lines.push(['Particulars', 'Scope', 'Delivered', 'Unit Rate', 'Scope Value', 'Delivered Value', 'Variance'])
  for (const r of m.rows) {
    lines.push([
      r.type,
      formatUnits(r.target),
      formatUnits(r.achieved),
      inrCsv(r.unitRate),
      inrCsv(r.scopeValue),
      inrCsv(r.deliveredValue),
      signed(inrCsv, r.variance),
    ])
  }
  lines.push([
    'Grand Total',
    formatUnits(m.totals.units),
    '—',
    '',
    inrCsv(m.totals.scope),
    inrCsv(m.totals.delivered),
    signed(inrCsv, m.totals.variance),
  ])

  const body = lines.map((row) => row.map(csvCell).join(',')).join('\r\n')
  // BOM so Excel reads ₹ and other UTF-8 correctly.
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8;' })
  download(blob, `sow-${safeFile(m.brandName)}-${safeFile(m.monthLabel)}.csv`)
}

// ── PDF ───────────────────────────────────────────────────────────────
export function exportSowPdf(input) {
  const m = buildModel(input)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 40

  // Header band
  doc.setFillColor(...THEME.primary)
  doc.rect(0, 0, pageW, 88, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(m.brandName, margin, 40)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Scope of Work', margin, 60)
  doc.setFontSize(9)
  doc.text(m.monthLabel, pageW - margin, 40, { align: 'right' })
  doc.text(`Generated ${m.generatedAt}`, pageW - margin, 56, { align: 'right' })

  // KPI strip
  let y = 112
  const kpis = [
    { label: 'Monthly Scope', value: inrPdf(m.totals.scope), color: THEME.ink },
    { label: 'Delivered', value: inrPdf(m.totals.delivered), color: THEME.ink },
    {
      label: 'Variance',
      value: signed(inrPdf, m.totals.variance),
      color: m.totals.variance > 0 ? THEME.success : m.totals.variance < 0 ? THEME.danger : THEME.muted,
    },
  ]
  const gap = 12
  const cardW = (pageW - margin * 2 - gap * 2) / 3
  kpis.forEach((k, i) => {
    const x = margin + i * (cardW + gap)
    doc.setFillColor(...THEME.zebra)
    doc.setDrawColor(...THEME.rule)
    doc.roundedRect(x, y, cardW, 54, 6, 6, 'FD')
    doc.setTextColor(...THEME.muted)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(k.label.toUpperCase(), x + 12, y + 20)
    doc.setTextColor(...k.color)
    doc.setFontSize(14)
    doc.text(k.value, x + 12, y + 42)
  })
  y += 54 + 20

  // Table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Particulars', 'Scope', 'Delivered', 'Unit', 'Scope Value', 'Delivered Value', 'Variance']],
    body: m.rows.map((r) => [
      r.type,
      formatUnits(r.target),
      formatUnits(r.achieved),
      inrPdf(r.unitRate),
      inrPdf(r.scopeValue),
      inrPdf(r.deliveredValue),
      signed(inrPdf, r.variance),
    ]),
    foot: [[
      'Grand Total',
      formatUnits(m.totals.units),
      '—',
      '',
      inrPdf(m.totals.scope),
      inrPdf(m.totals.delivered),
      signed(inrPdf, m.totals.variance),
    ]],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 6, textColor: THEME.ink, lineColor: THEME.rule, lineWidth: 0.5 },
    headStyles: { fillColor: THEME.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
    footStyles: { fillColor: THEME.zebra, textColor: THEME.ink, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [252, 251, 254] },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    // Colour variance cells in body + footer by sign.
    didParseCell(d) {
      if (d.column.index !== 6) return
      const raw = String(d.cell.raw || '')
      if (raw.startsWith('+')) d.cell.styles.textColor = THEME.success
      else if (raw.startsWith('-')) d.cell.styles.textColor = THEME.danger
    },
  })

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    const h = doc.internal.pageSize.getHeight()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...THEME.muted)
    doc.text('SOW Tracker', margin, h - 20)
    doc.text(`Page ${p} of ${pageCount}`, pageW - margin, h - 20, { align: 'right' })
  }

  doc.save(`sow-${safeFile(m.brandName)}-${safeFile(m.monthLabel)}.pdf`)
}

// ── shared ────────────────────────────────────────────────────────────
function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
