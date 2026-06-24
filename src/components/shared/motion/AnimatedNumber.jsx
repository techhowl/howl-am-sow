'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'

/**
 * Spring-ish count-up to `value`. Respects reduced-motion (shows final instantly).
 * `format` maps the running number → string (default: locale integer).
 */
export function AnimatedNumber({ value = 0, duration = 1.1, format, className }) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)
  const ref = useRef(value)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(ref.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    ref.current = value
    return () => controls.stop()
  }, [value, duration, reduce])

  const fmt = format || ((n) => Math.round(n).toLocaleString())
  return <span className={className}>{fmt(display)}</span>
}
