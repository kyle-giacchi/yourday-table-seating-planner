import React, { useState, useCallback, useRef } from 'react';
import { clamp } from '@/lib/utils';

interface GhostTablePreviewProps {
  pixelsPerInch: number;
  containerWidth: number;
  containerHeight: number;
}

export const GhostTablePreview = ({
  pixelsPerInch,
  containerWidth,
  containerHeight: _containerHeight,
}: GhostTablePreviewProps) => {
  const TABLE_INCHES = 60;
  const tablePx = TABLE_INCHES * pixelsPerInch;

  const [position, setPosition] = useState({ x: 50, y: 50 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragging.current = true;
      const rect = containerRef.current?.parentElement?.getBoundingClientRect();
      if (rect) {
        dragOffset.current = {
          x: e.clientX - (position.x / 100) * rect.width,
          y: e.clientY - (position.y / 100) * rect.height,
        };
      }

      const handleMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const r = containerRef.current?.parentElement?.getBoundingClientRect();
        if (!r) return;
        setPosition({
          x: clamp(((ev.clientX - dragOffset.current.x) / r.width) * 100, 0, 100),
          y: clamp(((ev.clientY - dragOffset.current.y) / r.height) * 100, 0, 100),
        });
      };

      const handleUp = () => {
        dragging.current = false;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [position],
  );

  if (tablePx < 2 || tablePx > containerWidth) return null;

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="60-inch round table preview — drag to reposition"
      className="border-primary/60 bg-primary/85 absolute flex cursor-grab items-center justify-center rounded-full border-2 border-dashed active:cursor-grabbing"
      style={{
        width: tablePx,
        height: tablePx,
        left: `calc(${position.x}% - ${tablePx / 2}px)`,
        top: `calc(${position.y}% - ${tablePx / 2}px)`,
      }}
      onMouseDown={handleMouseDown}
      title="60-inch round table (preview)"
    >
      <span className="text-primary-foreground pointer-events-none text-center text-[10px] leading-tight font-medium select-none">
        60&quot; round
        <br />
        preview
      </span>
    </div>
  );
};
