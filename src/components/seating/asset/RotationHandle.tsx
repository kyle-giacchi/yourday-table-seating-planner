import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';

export interface RotationHandleProps {
  /** Asset width in px (pre-rotation) — used to horizontally center the handle. */
  assetWidth: number;
  /** Called with the new rotation (0-360) during and at the end of a drag. */
  onChange: (nextRotation: number) => void;
}

const HANDLE_OFFSET = 24;

const snapDegrees = (value: number, snap: number): number => {
  return Math.round(value / snap) * snap;
};

const normalizeAngle = (deg: number): number => {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
};

export const RotationHandle = ({ assetWidth, onChange }: RotationHandleProps) => {
  const [isRotating, setIsRotating] = useState(false);
  const centerRef = useRef<{ x: number; y: number } | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = handleRef.current;
    if (!el) return;
    const assetEl = el.closest<HTMLElement>('[data-asset-id]');
    if (!assetEl) return;
    const rect = assetEl.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setIsRotating(true);
  }, []);

  useEffect(() => {
    if (!isRotating) return;

    const handleMove = (e: MouseEvent) => {
      const center = centerRef.current;
      if (!center) return;
      const dx = e.clientX - center.x;
      const dy = e.clientY - center.y;
      let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      deg = normalizeAngle(deg);
      if (e.shiftKey) {
        deg = normalizeAngle(snapDegrees(deg, 15));
      }
      onChange(deg);
    };

    const handleUp = () => {
      setIsRotating(false);
      centerRef.current = null;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'grabbing';
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
    };
  }, [isRotating, onChange]);

  return (
    <div
      ref={handleRef}
      data-asset-rotation-handle
      onMouseDown={handleMouseDown}
      className="border-input bg-popover text-foreground hover:bg-muted pointer-events-auto absolute z-40 flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border shadow-md active:cursor-grabbing"
      style={{
        left: assetWidth / 2,
        top: -HANDLE_OFFSET - 24,
      }}
      aria-label="Rotate asset"
      title="Drag to rotate. Hold Shift to snap to 15°."
    >
      <RotateCw size={12} />
    </div>
  );
};
