import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSeating } from '@/hooks/useSeating';
import { useRAFThrottle, useCachedElement } from '@/lib/performance';
import { calculateCanvasBoundaries, constrainPosition } from '../utils/boundaryCalculator';
import type { CanvasPoint } from '../types';

export interface UseTableDragProps {
  tableId: string;
  tableDimensions: { width: number; height: number };
  /** Coordinate transform — converts screen coords to canvas coords accounting for zoom + pan. */
  screenToCanvas: (screenX: number, screenY: number, canvasRect: DOMRect) => CanvasPoint;
}

export interface UseTableDragResult {
  isDragging: boolean;
  recentlyAssigned: boolean;
  /** True if the mouse actually moved during the current/last drag gesture. */
  wasDragged: React.MutableRefObject<boolean>;
  handleMouseDown: (e: React.MouseEvent, tableX: number, tableY: number) => void;
}

export const useTableDrag = ({
  tableId,
  tableDimensions,
  screenToCanvas,
}: UseTableDragProps): UseTableDragResult => {
  const { updateTable, canvasDimensions, seatingData } = useSeating();

  const [isDragging, setIsDragging] = useState(false);
  const [recentlyAssigned, setRecentlyAssigned] = useState(false);

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const canvasBoundariesRef = useRef<ReturnType<typeof calculateCanvasBoundaries> | null>(null);
  const prevGuestCountRef = useRef<number>(0);
  const wasDraggedRef = useRef(false);

  const getCanvas = useCachedElement('[data-seating-canvas]');

  // Track guest count changes for the recentlyAssigned animation
  const currentTable = useMemo(
    () => seatingData.tables.find((t) => t.id === tableId),
    [seatingData.tables, tableId],
  );
  const currentGuestCount = currentTable?.guests.length ?? 0;

  useEffect(() => {
    if (currentGuestCount > prevGuestCountRef.current) {
      setRecentlyAssigned(true);
      const timer = setTimeout(() => setRecentlyAssigned(false), 1000);
      prevGuestCountRef.current = currentGuestCount;
      return () => clearTimeout(timer);
    }
    prevGuestCountRef.current = currentGuestCount;
  }, [currentGuestCount]);

  // Memoised canvas boundaries so they are stable between renders when canvas
  // dimensions haven't changed.
  const canvasBoundaries = useMemo(
    () => calculateCanvasBoundaries(canvasDimensions),
    [canvasDimensions],
  );

  /**
   * Convert a screen-space mouse event coordinate to canvas-space using the
   * viewport's screenToCanvas transform (accounts for zoom + pan).
   */
  const calculateMousePosition = useCallback(
    (e: MouseEvent | React.MouseEvent): CanvasPoint | null => {
      const canvas = getCanvas();
      if (!canvas) return null;
      const canvasRect = canvas.getBoundingClientRect();
      return screenToCanvas(e.clientX, e.clientY, canvasRect);
    },
    [screenToCanvas, getCanvas],
  );

  const handleMouseMoveCore = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      wasDraggedRef.current = true;

      const mousePos = calculateMousePosition(e);
      if (!mousePos) return;

      const newX = mousePos.x - dragOffsetRef.current.x;
      const newY = mousePos.y - dragOffsetRef.current.y;

      const boundaries = canvasBoundariesRef.current ?? canvasBoundaries;
      const constrained = constrainPosition(newX, newY, tableDimensions, boundaries);

      updateTable(tableId, constrained);
    },
    [isDragging, calculateMousePosition, tableDimensions, canvasBoundaries, updateTable, tableId],
  );

  // Throttle the move handler to at most one update per animation frame
  const handleMouseMoveThrottled = useRAFThrottle(handleMouseMoveCore);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      handleMouseMoveThrottled(e);
    },
    [isDragging, handleMouseMoveThrottled],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    canvasBoundariesRef.current = null;
  }, []);

  // Attach / detach global listeners while dragging
  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, tableX: number, tableY: number) => {
      const target = e.target as HTMLElement;

      // Do not start a drag when the click originates from the settings icon
      if (target.closest('.settings-icon')) return;

      // Middle-click (button 1) is reserved for canvas panning
      if (e.button === 1) return;

      e.preventDefault();
      e.stopPropagation();

      wasDraggedRef.current = false;

      // Cache boundaries at drag-start so the mousemove handler doesn't need
      // to recalculate on every frame
      canvasBoundariesRef.current = canvasBoundaries;

      const mousePos = calculateMousePosition(e);
      if (!mousePos) return;

      dragOffsetRef.current = {
        x: mousePos.x - tableX,
        y: mousePos.y - tableY,
      };

      setIsDragging(true);
    },
    [calculateMousePosition, canvasBoundaries],
  );

  return { isDragging, recentlyAssigned, wasDragged: wasDraggedRef, handleMouseDown };
};
