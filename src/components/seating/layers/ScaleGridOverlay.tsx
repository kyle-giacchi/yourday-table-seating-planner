import React, { useMemo } from 'react';
import { useSeating } from '@/hooks/useSeating';

/**
 * ScaleGridOverlay
 *
 * Renders a soft 5-foot grid overlay across the entire canvas whenever
 * the user has toggled the grid on. When the scale reference is locked
 * the grid tracks the real-world calibration; otherwise it falls back
 * to 1 px / inch — the same default the table renderer uses, so the
 * grid stays consistent with table sizes without a background image.
 */
export const ScaleGridOverlay = () => {
  const { isReferenceLocked, getReferenceScale, showScaleGrid, canvasDimensions } = useSeating();

  const gridSize = useMemo(() => {
    const pixelsPerInch = isReferenceLocked ? getReferenceScale() : 1;
    // 5 feet = 60 inches
    return 60 * Math.max(0.1, pixelsPerInch);
  }, [isReferenceLocked, getReferenceScale]);

  if (!showScaleGrid || gridSize <= 0) return null;

  // Build enough grid lines to cover the canvas
  const cols = Math.ceil(canvasDimensions.width / gridSize) + 1;
  const rows = Math.ceil(canvasDimensions.height / gridSize) + 1;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={canvasDimensions.width}
      height={canvasDimensions.height}
      style={{ zIndex: 5 }}
    >
      <defs>
        <pattern
          id="scale-grid-5ft"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <line
            x1={gridSize}
            y1={0}
            x2={gridSize}
            y2={gridSize}
            stroke="rgba(0, 0, 0, 0.35)"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={gridSize}
            x2={gridSize}
            y2={gridSize}
            stroke="rgba(0, 0, 0, 0.35)"
            strokeWidth={1}
          />
        </pattern>
      </defs>

      {/* Grid fill */}
      <rect
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        fill="url(#scale-grid-5ft)"
      />

      {/* Column labels (top edge) */}
      {Array.from({ length: cols }, (_, colIdx) => {
        if (colIdx === 0) return null;
        const x = colIdx * gridSize;
        return (
          <text
            key={`col-${colIdx * 5}ft`}
            x={x}
            y={14}
            textAnchor="middle"
            fontSize={10}
            fill="rgba(0, 0, 0, 0.6)"
            fontFamily="system-ui, sans-serif"
          >
            {colIdx * 5}ft
          </text>
        );
      })}

      {/* Row labels (left edge) */}
      {Array.from({ length: rows }, (_, rowIdx) => {
        if (rowIdx === 0) return null;
        const y = rowIdx * gridSize;
        return (
          <text
            key={`row-${rowIdx * 5}ft`}
            x={4}
            y={y + 4}
            textAnchor="start"
            fontSize={10}
            fill="rgba(0, 0, 0, 0.6)"
            fontFamily="system-ui, sans-serif"
          >
            {rowIdx * 5}ft
          </text>
        );
      })}
    </svg>
  );
};
