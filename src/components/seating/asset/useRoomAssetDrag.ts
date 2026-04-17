import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSeating } from '@/hooks/useSeating';
import { useRAFThrottle, useCachedElement } from '@/lib/performance';
import { calculateCanvasBoundaries, constrainPosition } from '../utils/boundaryCalculator';
import type { CanvasPoint } from '../types';

export interface UseRoomAssetDragProps {
  assetId: string;
  assetDimensions: { width: number; height: number };
  screenToCanvas: (screenX: number, screenY: number, canvasRect: DOMRect) => CanvasPoint;
}

export interface UseRoomAssetDragResult {
  isDragging: boolean;
  wasDragged: React.MutableRefObject<boolean>;
  handleMouseDown: (e: React.MouseEvent, assetX: number, assetY: number) => void;
}

export const useRoomAssetDrag = ({
  assetId,
  assetDimensions,
  screenToCanvas,
}: UseRoomAssetDragProps): UseRoomAssetDragResult => {
  const { updateAsset, canvasDimensions } = useSeating();

  const [isDragging, setIsDragging] = useState(false);

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const canvasBoundariesRef = useRef<ReturnType<typeof calculateCanvasBoundaries> | null>(null);
  const wasDraggedRef = useRef(false);

  const getCanvas = useCachedElement('[data-seating-canvas]');

  const canvasBoundaries = useMemo(
    () => calculateCanvasBoundaries(canvasDimensions),
    [canvasDimensions],
  );

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
      const constrained = constrainPosition(newX, newY, assetDimensions, boundaries);
      updateAsset(assetId, constrained);
    },
    [isDragging, calculateMousePosition, assetDimensions, canvasBoundaries, updateAsset, assetId],
  );

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
    (e: React.MouseEvent, assetX: number, assetY: number) => {
      wasDraggedRef.current = false;
      const target = e.target as HTMLElement;
      if (target.closest('[data-asset-pill]') || target.closest('[data-asset-rotation-handle]')) {
        return;
      }

      // Middle-click (button 1) is reserved for canvas panning
      if (e.button === 1) return;

      e.preventDefault();
      e.stopPropagation();
      canvasBoundariesRef.current = canvasBoundaries;
      const mousePos = calculateMousePosition(e);
      if (!mousePos) return;
      dragOffsetRef.current = {
        x: mousePos.x - assetX,
        y: mousePos.y - assetY,
      };
      setIsDragging(true);
    },
    [calculateMousePosition, canvasBoundaries],
  );

  return { isDragging, wasDragged: wasDraggedRef, handleMouseDown };
};
