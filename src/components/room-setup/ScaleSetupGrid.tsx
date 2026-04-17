import React from 'react';

interface ScaleSetupGridProps {
  pixelsPerInch: number;
  containerWidth: number;
  containerHeight: number;
}

/**
 * Lightweight 1-foot grid overlay used inside the room setup canvas to let
 * users sanity-check their scale before committing. Mirrors the look of
 * ScaleGridOverlay (used on the main seating canvas) but is dimensioned by
 * the props we pass in rather than reading from useSeating context.
 */
export const ScaleSetupGrid = ({
  pixelsPerInch,
  containerWidth,
  containerHeight,
}: ScaleSetupGridProps) => {
  const gridSize = 12 * pixelsPerInch; // 1 foot
  if (gridSize < 6 || containerWidth <= 0 || containerHeight <= 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={containerWidth}
      height={containerHeight}
      style={{ zIndex: 5 }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="setup-grid-1ft"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="hsl(var(--primary) / 0.25)"
            strokeWidth={1}
          />
        </pattern>
      </defs>
      <rect width={containerWidth} height={containerHeight} fill="url(#setup-grid-1ft)" />
    </svg>
  );
};
