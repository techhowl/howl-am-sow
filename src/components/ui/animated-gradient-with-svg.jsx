'use client'

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Soft multi-colour gradient wash used behind card headers and hero sections.
 *
 * Previously this rendered one oversized <svg> circle per colour, each sized from a
 * measured container and wrapped in `blur-3xl` / `blur-[100px]`, carrying the class
 * `animate-background-gradient`. Two problems with that:
 *
 *   1. `animate-background-gradient` never existed. Its keyframes lived in
 *      tailwind.config.js, and this project is on Tailwind v4, which does not read
 *      that file unless the CSS opts in with `@config`. The class compiled to
 *      nothing, so the blobs were always frozen — the "broken animation" on /login.
 *   2. Large blurred layers are expensive, and this component is used ~20 times.
 *
 * CSS radial-gradients give the same soft look with no SVG, no layout measurement
 * and no blur filter. The props are unchanged so every call site still works.
 * `speed` is accepted but unused — these are intentionally static now.
 */
const deterministicRandom = (seed) => {
  const x = Math.sin(seed * 10000);
  return x - Math.floor(x);
};

const deterministicRandomInt = (min, max, seed) =>
  Math.floor(deterministicRandom(seed) * (max - min + 1)) + min;

// Wider spread reads as a heavier, more diffuse wash — mirrors the old blur levels.
const SPREAD = { light: 55, medium: 70, heavy: 90 };

const AnimatedGradient = ({ colors, speed, blur = "light", className }) => {
  const backgroundImage = useMemo(() => {
    const spread = SPREAD[blur] ?? SPREAD.light;
    return colors
      .map((color, index) => {
        // Same deterministic placement as before, so positions look familiar.
        const top = deterministicRandom(index * 2) * 50;
        const left = deterministicRandom(index * 3) * 50;
        const scale = deterministicRandomInt(5, 15, index * 12) / 10;
        const radius = spread * scale;
        return `radial-gradient(${radius}% ${radius}% at ${left + 25}% ${top + 25}%, ${color} 0%, transparent 70%)`;
      })
      .join(", ");
  }, [colors, blur]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        "opacity-30 dark:opacity-[0.15]",
        className
      )}
      style={{ backgroundImage }}
    />
  );
};

export { AnimatedGradient };
