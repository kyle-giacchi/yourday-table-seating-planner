import React, { useCallback, useRef, useState } from 'react';

export type ReferenceShape = 'circle' | 'rect';

interface ScaleReferenceShapeProps {
  /** Shape outline */
  shape: ReferenceShape;
  /** Real-world width in inches */
  widthInches: number;
  /** Real-world height in inches */
  heightInches: number;
  /** Pixels per inch (current scale) */
  pixelsPerInch: number;
  /** Container width in pixels (for fit/clip checks) */
  containerWidth: number;
  /** Container height in pixels */
  containerHeight: number;
  /** Initial position in percent of container (anchors top-left of shape) */
  initialPercent: { x: number; y: number };
  /** Short label drawn inside the shape */
  label: string;
  /** Tailwind color classes for fill / border */
  colorClass: string;
}

/**
 * A draggable real-world reference object rendered at the current scale.
 * Used during room setup so users can sanity-check that a known object
 * (table / door / person) looks the right size on their floor plan.
 */
export const ScaleReferenceShape = ({
  shape,
  widthInches,
  heightInches,
  pixelsPerInch,
  containerWidth,
  containerHeight,
  initialPercent,
  label,
  colorClass,
}: ScaleReferenceShapeProps) => {
  const widthPx = widthInches * pixelsPerInch;
  const heightPx = heightInches * pixelsPerInch;

  const [position, setPosition] = useState(initialPercent);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const elRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragging.current = true;
      const parent = elRef.current?.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      offset.current = {
        x: e.clientX - (position.x / 100) * r.width,
        y: e.clientY - (position.y / 100) * r.height,
      };

      const move = (ev: PointerEvent) => {
        if (!dragging.current) return;
        const rect = parent.getBoundingClientRect();
        setPosition({
          x: Math.max(0, Math.min(100, ((ev.clientX - offset.current.x) / rect.width) * 100)),
          y: Math.max(0, Math.min(100, ((ev.clientY - offset.current.y) / rect.height) * 100)),
        });
      };
      const up = () => {
        dragging.current = false;
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    },
    [position],
  );

  // Hide if too small to see or larger than the container.
  if (widthPx < 4 || heightPx < 4) return null;
  if (widthPx > containerWidth || heightPx > containerHeight) return null;

  const isCircle = shape === 'circle';
  return (
    <div
      ref={elRef}
      role="img"
      aria-label={`${label} reference — drag to reposition`}
      className={`absolute flex cursor-grab items-center justify-center border-2 border-dashed text-center select-none active:cursor-grabbing ${colorClass} ${
        isCircle ? 'rounded-full' : 'rounded-sm'
      }`}
      style={{
        width: widthPx,
        height: heightPx,
        left: `calc(${position.x}% - ${widthPx / 2}px)`,
        top: `calc(${position.y}% - ${heightPx / 2}px)`,
      }}
      onPointerDown={handlePointerDown}
      title={`${label} (${widthInches / 12}'\u00d7${heightInches / 12}')`}
    >
      <span className="pointer-events-none px-1 text-[10px] leading-tight font-medium">
        {label}
      </span>
    </div>
  );
};
