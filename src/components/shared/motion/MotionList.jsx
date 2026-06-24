'use client'

import { motion, useReducedMotion } from 'motion/react'

/**
 * Staggered entrance container + item. transform/opacity only.
 *   <MotionList><MotionItem>…</MotionItem>…</MotionList>
 * Respects prefers-reduced-motion (renders instantly).
 */
const EASE = [0.16, 1, 0.3, 1]

export function MotionList({ children, className, as = 'div', stagger = 0.05, ...props }) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] || motion.div
  return (
    <MotionTag
      className={className}
      initial={reduce ? false : 'hidden'}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : stagger } },
      }}
      {...props}
    >
      {children}
    </MotionTag>
  )
}

export function MotionItem({ children, className, as = 'div', ...props }) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] || motion.div
  return (
    <MotionTag
      className={className}
      variants={{
        hidden: reduce ? {} : { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
      }}
      {...props}
    >
      {children}
    </MotionTag>
  )
}
