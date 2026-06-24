/**
 * Fixed gradient-mesh aurora behind the whole app. Glass surfaces borrow its color.
 * Rendered once in the root layout; purely decorative (aria-hidden, pointer-events:none).
 */
export function AuroraBackdrop() {
  return <div className="aurora-bg" aria-hidden="true" />
}
