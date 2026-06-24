import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind-aware conflict resolution.
 * Consume semantic tokens (bg-card, text-muted-foreground) — never hardcode color.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
