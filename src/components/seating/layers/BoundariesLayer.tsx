import React, { useMemo } from 'react';

interface BoundariesLayerProps {
  canvasDimensions: { width: number; height: number };
}

const STRIPE_GRADIENT =
  'repeating-linear-gradient(45deg, #f5f5f5 0px, #f5f5f5 8px, #e5e5e5 8px, #e5e5e5 16px)';

/**
 * BoundariesLayer
 *
 * Purely visual hazard stripes around the edges of the canvas that indicate the
 * "out-of-bounds" area beyond the safe working zone.  All elements are
 * pointer-events-none so they never interfere with table drag or other
 * interactions.
 */
export const BoundariesLayer = ({ canvasDimensions }: BoundariesLayerProps) => {
  // Padding = max(2% of shortest edge, 10px).
  const padding = useMemo(() => {
    const twoPct = Math.min(canvasDimensions.width, canvasDimensions.height) * 0.02;
    return Math.max(twoPct, 10);
  }, [canvasDimensions.width, canvasDimensions.height]);

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }} aria-hidden="true">
      {/* Top stripe */}
      <div
        className="absolute top-0 right-0 left-0"
        style={{ height: padding, background: STRIPE_GRADIENT }}
      />

      {/* Bottom stripe */}
      <div
        className="absolute right-0 bottom-0 left-0"
        style={{ height: padding, background: STRIPE_GRADIENT }}
      />

      {/* Left stripe */}
      <div
        className="absolute top-0 bottom-0 left-0"
        style={{ width: padding, background: STRIPE_GRADIENT }}
      />

      {/* Right stripe */}
      <div
        className="absolute top-0 right-0 bottom-0"
        style={{ width: padding, background: STRIPE_GRADIENT }}
      />

      {/* Safe-zone dashed inner border */}
      <div
        className="border-input pointer-events-none absolute border border-dashed opacity-30"
        style={{
          top: padding,
          left: padding,
          right: padding,
          bottom: padding,
        }}
      />
    </div>
  );
};
