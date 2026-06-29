import React, { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useDimensions } from "@/components/hooks/use-debounced-dimensions";

// Deterministic pseudo-random based on index
const deterministicRandom = (seed) => {
  const x = Math.sin(seed * 10000);
  return x - Math.floor(x);
};

const deterministicRandomInt = (min, max, seed) => {
  return Math.floor(deterministicRandom(seed) * (max - min + 1)) + min;
};

const AnimatedGradient = ({
  colors,
  speed = 5,
  blur = "light",
}) => {
  const containerRef = useRef(null);
  const dimensions = useDimensions(containerRef);

  const circleSize = useMemo(
    () => Math.max(dimensions.width, dimensions.height),
    [dimensions.width, dimensions.height]
  );

  const blurClass =
    blur === "light"
      ? "blur-2xl"
      : blur === "medium"
      ? "blur-3xl"
      : "blur-[100px]";

  // Generate deterministic positions and animations based on index
  const gradientElements = useMemo(() => 
    colors.map((color, index) => ({
      color,
      top: `${deterministicRandom(index * 2) * 50}%`,
      left: `${deterministicRandom(index * 3) * 50}%`,
      tx1: deterministicRandom(index * 4) - 0.5,
      ty1: deterministicRandom(index * 5) - 0.5,
      tx2: deterministicRandom(index * 6) - 0.5,
      ty2: deterministicRandom(index * 7) - 0.5,
      tx3: deterministicRandom(index * 8) - 0.5,
      ty3: deterministicRandom(index * 9) - 0.5,
      tx4: deterministicRandom(index * 10) - 0.5,
      ty4: deterministicRandom(index * 11) - 0.5,
      sizeMultiplier: deterministicRandomInt(5, 15, index * 12) / 10,
    })),
    [colors]
  );

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className={cn(`absolute inset-0`, blurClass)}>
        {gradientElements.map((element, index) => (
          <svg
            key={index}
            className="absolute animate-background-gradient"
            style={{
              top: element.top,
              left: element.left,
              "--background-gradient-speed": `${1 / speed}s`,
              "--tx-1": element.tx1,
              "--ty-1": element.ty1,
              "--tx-2": element.tx2,
              "--ty-2": element.ty2,
              "--tx-3": element.tx3,
              "--ty-3": element.ty3,
              "--tx-4": element.tx4,
              "--ty-4": element.ty4,
            }}
            width={circleSize * element.sizeMultiplier}
            height={circleSize * element.sizeMultiplier}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="50"
              fill={element.color}
              className="opacity-30 dark:opacity-[0.15]"
            />
          </svg>
        ))}
      </div>
    </div>
  );
};

export { AnimatedGradient };
