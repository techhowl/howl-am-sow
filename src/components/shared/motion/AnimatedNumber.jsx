'use client'

import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'motion/react'

const DEFAULT_FORMAT = (n) => Math.round(n).toLocaleString()

/**
 * Count-up to `value`. Respects reduced-motion (shows the final value instantly).
 *
 * The animation writes straight to the DOM node instead of going through React
 * state. The previous version called setDisplay() from onUpdate, which re-rendered
 * this component on every animation frame - roughly 60 renders a second, for over
 * a second, for each stat card on the dashboard at once. That is what made the
 * dashboard hitch right as it appeared.
 */
export function AnimatedNumber({ value = 0, duration = 1.1, format, className }) {
  const reduce = useReducedMotion()
  const nodeRef = useRef(null)
  const fromRef = useRef(0)

  // Held in a ref so an inline `format` arrow does not restart the animation
  // on every parent render.
  const formatRef = useRef(format)
  formatRef.current = format

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const fmt = formatRef.current || DEFAULT_FORMAT

    if (reduce) {
      node.textContent = fmt(value)
      fromRef.current = value
      return
    }

    const controls = animate(fromRef.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = fmt(v)
      },
    })
    fromRef.current = value

    return () => controls.stop()
  }, [value, duration, reduce])

  // Render the final value on the server and on first paint, so the number is
  // correct without JS and the layout never shifts as digits are added.
  const fmt = format || DEFAULT_FORMAT
  return (
    <span ref={nodeRef} className={className}>
      {fmt(value)}
    </span>
  )
}
