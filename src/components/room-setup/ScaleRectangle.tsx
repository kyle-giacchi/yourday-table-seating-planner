import React, { useState, useCallback, useRef } from 'react';
import { clamp } from '@/lib/utils';

interface ScaleRectangleProps {
  /** Rectangle position & size as percentages (0-100) of the container */
  x: number;
  y: number;
  width: number;
  height: number;
  onChange: (rect: { x: number; y: number; width: number; height: number }) => void;
  disabled?: boolean;
  labelText?: string;
  /**
   * Target height%/width% ratio so the visual rect matches the real-world
   * aspect. Compute as `(containerWidth/containerHeight) / (realWorldWidth/realWorldHeight)`.
   * Default 1 = square in percent space (old behavior).
   */
  aspectRatio?: number;
}

type Handle = 'ne' | 'nw' | 'se' | 'sw';

const HANDLES: { key: Handle; cursor: string; position: string }[] = [
  { key: 'nw', cursor: 'nw-resize', position: '-top-1.5 -left-1.5' },
  { key: 'ne', cursor: 'ne-resize', position: '-top-1.5 -right-1.5' },
  { key: 'sw', cursor: 'sw-resize', position: '-bottom-1.5 -left-1.5' },
  { key: 'se', cursor: 'se-resize', position: '-bottom-1.5 -right-1.5' },
];

const MIN_SIZE = 3; // minimum 3% of container

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const clampRect = (rect: Rect, aspectRatio: number): Rect => {
  // Width must fit so that the aspect-derived height also fits within 0-100.
  const maxWidth = aspectRatio > 0 ? Math.min(100, 100 / aspectRatio) : 100;
  const width = clamp(rect.width, MIN_SIZE, maxWidth);
  const height = width * aspectRatio;
  return {
    x: clamp(rect.x, 0, 100 - width),
    y: clamp(rect.y, 0, 100 - height),
    width,
    height,
  };
};

const rectClassName = (disabled: boolean, active: boolean): string => {
  if (disabled) return 'cursor-default border-orange-400/40 bg-orange-400/5';
  if (active) return 'cursor-grabbing border-orange-500 bg-orange-400/10';
  return 'cursor-grab border-orange-400/70 bg-orange-400/5 hover:bg-orange-400/10';
};

const RectLabel = ({ text }: { text: string }) => (
  <div className="pointer-events-none absolute -top-7 left-0 rounded bg-orange-500 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white shadow-sm select-none">
    {text}
  </div>
);

const ResizeHandles = ({ onStart }: { onStart: (e: React.MouseEvent, handle: Handle) => void }) => (
  <>
    {HANDLES.map(({ key, cursor, position }) => (
      <div
        key={key}
        role="separator"
        aria-label={`Resize ${key}`}
        className={`absolute h-3 w-3 rounded-sm border border-white bg-orange-500 transition-colors hover:bg-orange-400 ${position}`}
        style={{ cursor }}
        onMouseDown={(e) => onStart(e, key)}
      />
    ))}
  </>
);

/** Compute the new rectangle after resizing from a specific corner handle. Maintains target aspectRatio (h/w). */
const computeSquareResize = (
  handle: Handle,
  start: Rect,
  dx: number,
  dy: number,
  aspectRatio: number,
): Rect => {
  // Normalize dy into width-space so we can pick the dominant drag direction.
  const dyAsWidth = aspectRatio > 0 ? dy / aspectRatio : dy;
  const delta = Math.abs(dx) > Math.abs(dyAsWidth) ? dx : dyAsWidth;

  const growingTowardSE = handle === 'se' || handle === 'ne';
  const newWidth = Math.max(MIN_SIZE, start.width + (growingTowardSE ? delta : -delta));
  const newHeight = newWidth * aspectRatio;

  const anchoredRight = handle === 'sw' || handle === 'nw';
  const anchoredBottom = handle === 'nw' || handle === 'ne';

  return {
    x: anchoredRight ? start.x + start.width - newWidth : start.x,
    y: anchoredBottom ? start.y + start.height - newHeight : start.y,
    width: newWidth,
    height: newHeight,
  };
};

export const ScaleRectangle = ({
  x,
  y,
  width,
  height,
  onChange,
  disabled = false,
  labelText,
  aspectRatio = 1,
}: ScaleRectangleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<{
    type: 'drag' | 'resize';
    handle?: Handle;
    startMouse: { x: number; y: number };
    startRect: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const [active, setActive] = useState(false);

  const getPercent = useCallback((clientX: number, clientY: number) => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return { x: 0, y: 0 };
    const r = parent.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * 100,
      y: ((clientY - r.top) / r.height) * 100,
    };
  }, []);

  const startAction = useCallback(
    (e: React.MouseEvent, type: 'drag' | 'resize', handle?: Handle) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      const mouse = getPercent(e.clientX, e.clientY);
      actionRef.current = {
        type,
        handle,
        startMouse: mouse,
        startRect: { x, y, width, height },
      };
      setActive(true);

      const handleMove = (ev: MouseEvent) => {
        const action = actionRef.current;
        if (!action) return;
        const cur = getPercent(ev.clientX, ev.clientY);
        const dx = cur.x - action.startMouse.x;
        const dy = cur.y - action.startMouse.y;
        const s = action.startRect;

        if (action.type === 'drag') {
          onChange(
            clampRect({ x: s.x + dx, y: s.y + dy, width: s.width, height: s.height }, aspectRatio),
          );
          return;
        }
        onChange(
          clampRect(computeSquareResize(action.handle!, s, dx, dy, aspectRatio), aspectRatio),
        );
      };

      const handleUp = () => {
        actionRef.current = null;
        setActive(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [disabled, x, y, width, height, getPercent, onChange, aspectRatio],
  );

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={labelText || 'Scale rectangle'}
      className={`absolute border-2 border-dashed transition-colors select-none ${rectClassName(disabled, active)}`}
      style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%`, zIndex: 40 }}
      onMouseDown={disabled ? undefined : (e) => startAction(e, 'drag')}
    >
      {labelText && <RectLabel text={labelText} />}
      {!disabled && <ResizeHandles onStart={(e, handle) => startAction(e, 'resize', handle)} />}
    </div>
  );
};
