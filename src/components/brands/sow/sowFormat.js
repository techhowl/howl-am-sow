// src/components/brands/sow/sowFormat.js
// Shared SOW formatting + variance-tone helpers.
// Used by SOWTab, SOW sub-components, and ScopeVarianceSection.

export const FIXED_SOW_TYPES = [
  'Static', 'Static Adapt', 'Video', 'Video Adapt',
  'Reel', 'Carousel', 'GIF', 'Story', 'Performance Asset',
]

/** Static INR string (₹, Indian grouping). For non-animated text (notes, tooltips). */
export function formatINR(n) {
  if (n == null || isNaN(n)) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

/** Unit count: integer as-is, else up to 2 decimals. */
export function formatUnits(n) {
  if (n == null || isNaN(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

/** Tailwind text-color class for a signed variance value. */
export function varianceTextClass(v) {
  if (v > 0) return 'text-success'
  if (v < 0) return 'text-destructive'
  return 'text-muted-foreground'
}

/** Subtle tinted background for a variance pill — returns a CSS value for `style`. */
export function varianceTint(v, strength = 12) {
  if (v > 0) return `color-mix(in oklab, var(--success) ${strength}%, transparent)`
  if (v < 0) return `color-mix(in oklab, var(--destructive) ${strength}%, transparent)`
  return 'transparent'
}
