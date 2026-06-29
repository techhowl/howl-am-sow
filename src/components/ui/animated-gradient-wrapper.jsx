'use client';

import { useEffect, useState } from 'react';
import { AnimatedGradient } from './animated-gradient-with-svg';

// Client-only wrapper to prevent hydration mismatches
export function AnimatedGradientWrapper(props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return <div className="absolute inset-0" />;
  }

  return <AnimatedGradient {...props} />;
}
