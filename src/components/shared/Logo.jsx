import { cn } from '@/lib/utils'
import howlLogo from './howl-logo.png'

/**
 * Howl brand logo (real lockup: HOWL wordmark + wolf + tagline).
 * Static-imported PNG → bundled + served by webpack at a hashed URL,
 * so it works without relying on public/ dev-serving (which 404'd).
 * `size` = rendered height in px; width scales to the asset aspect ratio.
 * `variant`/`tone` accepted for backward-compat but unused.
 */
const SRC = typeof howlLogo === 'string' ? howlLogo : howlLogo.src

export function Logo({ size = 32, className, alt = "Howl — Digital's New Breed" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC}
      alt={alt}
      className={cn('w-auto object-contain select-none', className)}
      style={{ height: size, width: 'auto', filter: 'drop-shadow(0 1px 6px oklch(0 0 0 / 0.18))' }}
    />
  )
}
