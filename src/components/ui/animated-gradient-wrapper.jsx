'use client';

import { AnimatedGradient } from './animated-gradient-with-svg';

/**
 * Historically this gated rendering behind a mount flag, because the old
 * SVG implementation measured its container on the client and produced a
 * hydration mismatch. The gradient is now pure deterministic CSS that renders
 * identically on server and client, so the gate is gone — it only delayed
 * paint and caused a visible flash on first load.
 */
export function AnimatedGradientWrapper(props) {
  return <AnimatedGradient {...props} />;
}
