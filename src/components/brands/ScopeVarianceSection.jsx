// src/components/brands/ScopeVarianceSection.jsx
'use client'

import { TrendingUp, TrendingDown, IndianRupee } from 'lucide-react'

function formatINR(n) {
  if (n == null || isNaN(n)) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}
function formatUnits(n) {
  if (n == null || isNaN(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

export default function ScopeVarianceSection({ budgetSummary, sowByType }) {
  if (!budgetSummary || budgetSummary.scopeValue === 0) {
    return (
      <div style={{ padding: 20, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Scope &amp; Delivery Value</h3>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>No pricing set for this month&apos;s SOW. Add unit rates in the Scope of Work tab to see value tracking.</p>
      </div>
    )
  }

  const {
    scopeValue,
    deliveredValue,
    pendingValue,
    variance,
    deliveredPercent,
  } = budgetSummary

  const rowsWithBudget = sowByType.filter((row) => row.target !== null && row.unitRate > 0)

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Scope &amp; Delivery Value</h3>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>· Monthly retainer reconciliation</span>
      </div>

      {/* Top summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 16,
      }}>
        {/* Scope */}
        <div style={{ padding: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scope Value</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{formatINR(scopeValue)}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Committed this month</p>
        </div>

        {/* Delivered */}
        <div style={{ padding: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <IndianRupee size={12} color="#16a34a" />
            <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivered Value</p>
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{formatINR(deliveredValue)}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{deliveredPercent}% of scope</p>
          <div style={{ marginTop: 8, height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(deliveredPercent, 100)}%`, height: '100%', background: '#16a34a', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Pending */}
        <div style={{ padding: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Value</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#d97706', margin: 0 }}>{formatINR(pendingValue)}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>If pending tasks complete</p>
        </div>

        {/* Variance */}
        <div style={{
          padding: 14,
          background: variance > 0 ? '#f0fdf4' : variance < 0 ? '#fef2f2' : '#fff',
          border: `1px solid ${variance > 0 ? '#bbf7d0' : variance < 0 ? '#fecaca' : '#e5e7eb'}`,
          borderRadius: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            {variance > 0
              ? <TrendingUp size={12} color="#15803d" />
              : variance < 0 ? <TrendingDown size={12} color="#dc2626" /> : null}
            <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variance</p>
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: variance > 0 ? '#15803d' : variance < 0 ? '#dc2626' : '#111827', margin: 0 }}>
            {variance > 0 ? '+' : ''}{formatINR(variance)}
          </p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>
            {variance > 0 ? 'Overdelivered — adjust next month' : variance < 0 ? 'Underdelivered — catch up next month' : 'On scope'}
          </p>
        </div>
      </div>

      {/* Per-type breakdown table (matches spreadsheet) */}
      {rowsWithBudget.length > 0 && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 70px 80px 90px 110px 110px 110px',
            padding: '10px 14px',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            gap: 8,
            fontSize: 10,
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <span>Particulars</span>
            <span style={{ textAlign: 'center' }}>Scope</span>
            <span style={{ textAlign: 'center' }}>Delivered</span>
            <span style={{ textAlign: 'center' }}>Unit ₹</span>
            <span style={{ textAlign: 'right' }}>Scope ₹</span>
            <span style={{ textAlign: 'right' }}>Delivered ₹</span>
            <span style={{ textAlign: 'right' }}>Variance</span>
          </div>
          {rowsWithBudget.map((row, idx) => {
            const varColor = row.variance > 0 ? '#15803d' : row.variance < 0 ? '#dc2626' : '#6b7280'
            const varBg    = row.variance > 0 ? '#dcfce7' : row.variance < 0 ? '#fee2e2' : 'transparent'
            return (
              <div
                key={row.type}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 70px 80px 90px 110px 110px 110px',
                  padding: '11px 14px',
                  alignItems: 'center',
                  borderBottom: idx < rowsWithBudget.length - 1 ? '1px solid #f3f4f6' : 'none',
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.type}>
                  {row.type}
                </span>
                <span style={{ color: '#374151', textAlign: 'center' }}>{formatUnits(row.target)}</span>
                <span style={{ color: row.achieved >= row.target ? '#15803d' : '#374151', fontWeight: row.achieved >= row.target ? 600 : 500, textAlign: 'center' }}>
                  {row.achieved}
                </span>
                <span style={{ color: '#6b7280', textAlign: 'center' }}>{formatINR(row.unitRate)}</span>
                <span style={{ color: '#111827', fontWeight: 500, textAlign: 'right' }}>{formatINR(row.scopeValue)}</span>
                <span style={{ color: '#111827', fontWeight: 500, textAlign: 'right' }}>{formatINR(row.deliveredValue)}</span>
                <span style={{
                  color: varColor, fontWeight: 700, textAlign: 'right',
                  padding: '2px 6px', borderRadius: 4, background: varBg,
                  display: 'inline-block', justifySelf: 'end',
                }}>
                  {row.variance > 0 ? '+' : ''}{formatINR(row.variance)}
                </span>
              </div>
            )
          })}
          {/* Grand Total row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 70px 80px 90px 110px 110px 110px',
            padding: '12px 14px',
            background: '#f9fafb',
            borderTop: '2px solid #e5e7eb',
            gap: 8,
            fontSize: 13,
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, color: '#111827' }}>Grand Total</span>
            <span />
            <span />
            <span />
            <span style={{ fontWeight: 700, color: '#4f46e5', textAlign: 'right' }}>{formatINR(scopeValue)}</span>
            <span style={{ fontWeight: 700, color: '#4f46e5', textAlign: 'right' }}>{formatINR(deliveredValue)}</span>
            <span style={{
              fontWeight: 700,
              color: variance > 0 ? '#15803d' : variance < 0 ? '#dc2626' : '#111827',
              textAlign: 'right',
              padding: '4px 8px', borderRadius: 4,
              background: variance > 0 ? '#dcfce7' : variance < 0 ? '#fee2e2' : 'transparent',
              display: 'inline-block', justifySelf: 'end',
            }}>
              {variance > 0 ? '+' : ''}{formatINR(variance)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}