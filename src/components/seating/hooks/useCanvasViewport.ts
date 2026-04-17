import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSeating } from '@/hooks/useSeating';
import { clamp } from '@/lib/utils';
import type { ViewportState, CanvasPoint } from '../types';
import { screenToCanvas as screenToCanvasUtil, getViewportTransform } from '../utils/coordinates';

const ZOOM_MIN = 0.8;
const ZOOM_MAX = 4.0;
/** Step used for Ctrl+wheel zoom. */
const ZOOM_WHEEL_FACTOR = 0.1;
/** Pan pixels per wheel tick (before zoom division). */
const PAN_WHEEL_STEP = 60;

const clampZoom = (zoom: number) => clamp(zoom, ZOOM_MIN, ZOOM_MAX);

/**
 * useCanvasViewport
 *
 * Manages the combined zoom + pan state for the seating canvas.
 *
 * - Zoom is sourced from (and written back to) the UIState context via
 *   `useSeating()` so other consumers (zoom controls, etc.) stay in sync.
 * - Pan is local state because nothing outside this hook needs it.
 * - Accepts a canvasRef so it can attach a native non-passive wheel listener
 *   that prevents page scrolling when the mouse is over the canvas.
 */
export function useCanvasViewport(canvasRef: React.RefObject<HTMLDivElement | null>) {
  const { zoomState, setZoom } = useSeating();

  // Pan offsets in pre-zoom canvas pixels.
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Tracks middle-click / Space+drag panning.
  const panStartRef = useRef<{
    screenX: number;
    screenY: number;
    panX: number;
    panY: number;
  } | null>(null);

  // ─── Derived viewport snapshot ──────────────────────────────────────────────

  const viewport: ViewportState = useMemo(
    () => ({ zoom: zoomState.level, panX, panY }),
    [zoomState.level, panX, panY],
  );

  // ─── Coordinate helpers ──────────────────────────────────────────────────────

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number, canvasRect: DOMRect): CanvasPoint =>
      screenToCanvasUtil(screenX, screenY, canvasRect, zoomState.level, panX, panY),
    [zoomState.level, panX, panY],
  );

  // ─── Zoom ───────────────────────────────────────────────────────────────────

  /**
   * Zoom toward/away from a canvas-space focal point so that the point under
   * the cursor stays visually stationary.
   *
   * When a focal point is provided, we adjust the pan so that:
   *   focalCanvas = (focalScreen - canvasOrigin) / newZoom - newPan
   * stays the same as before, giving us:
   *   newPan = (focalScreen - canvasOrigin) / newZoom - focalCanvas
   *
   * Because we don't have access to the canvas DOMRect here, callers supply
   * the already-computed canvas-space focal point plus the raw screen position
   * so we can derive the new pan.
   */
  const zoomToward = useCallback(
    (
      newZoomRaw: number,
      focalCanvasPoint?: CanvasPoint,
      focalScreenPoint?: { x: number; y: number },
      canvasRect?: DOMRect,
    ) => {
      const newZoom = clampZoom(newZoomRaw);
      setZoom(newZoom);

      if (focalCanvasPoint && focalScreenPoint && canvasRect) {
        // Keep focal point stationary:
        //   newPan = (focalScreen - canvasOrigin) / newZoom - focalCanvas
        const newPanX = (focalScreenPoint.x - canvasRect.left) / newZoom - focalCanvasPoint.x;
        const newPanY = (focalScreenPoint.y - canvasRect.top) / newZoom - focalCanvasPoint.y;
        setPanX(newPanX);
        setPanY(newPanY);
      }
    },
    [setZoom],
  );

  // ─── Wheel handler (native non-passive to block page scroll) ────────────────

  // Store latest state in refs so the native listener always sees current values
  // without needing to re-attach on every state change.
  const zoomRef = useRef(zoomState.level);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  useEffect(() => {
    zoomRef.current = zoomState.level;
  }, [zoomState.level]);
  useEffect(() => {
    panXRef.current = panX;
  }, [panX]);
  useEffect(() => {
    panYRef.current = panY;
  }, [panY]);

  /**
   * Attach a native wheel listener with { passive: false } so that
   * e.preventDefault() actually blocks page scrolling when the mouse
   * is over the canvas.
   *
   * - plain wheel / Ctrl+wheel  → zoom toward cursor
   * - Shift + wheel             → horizontal pan
   */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();

      const rect = el.getBoundingClientRect();

      if (e.shiftKey) {
        // Horizontal pan.
        const delta = (e.deltaY / zoomRef.current) * PAN_WHEEL_STEP * 0.1;
        setPanX((prev) => prev - delta);
      } else {
        // Zoom toward the cursor.
        const delta = e.deltaY > 0 ? -ZOOM_WHEEL_FACTOR : ZOOM_WHEEL_FACTOR;
        const newZoomRaw = zoomRef.current * (1 + delta);
        const newZoom = clampZoom(newZoomRaw);

        const focalCanvas = screenToCanvasUtil(
          e.clientX,
          e.clientY,
          rect,
          zoomRef.current,
          panXRef.current,
          panYRef.current,
        );
        zoomToward(newZoom, focalCanvas, { x: e.clientX, y: e.clientY }, rect);
      }
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [canvasRef, zoomToward]);

  // ─── Middle-click / Space+drag pan ──────────────────────────────────────────

  const handlePanStart = useCallback(
    (e: React.MouseEvent) => {
      panStartRef.current = {
        screenX: e.clientX,
        screenY: e.clientY,
        panX,
        panY,
      };
    },
    [panX, panY],
  );

  const handlePanMove = useCallback(
    (e: React.MouseEvent) => {
      if (!panStartRef.current) return;

      const dx = e.clientX - panStartRef.current.screenX;
      const dy = e.clientY - panStartRef.current.screenY;

      // Screen-space delta → canvas-space delta by dividing by zoom.
      setPanX(panStartRef.current.panX + dx / zoomState.level);
      setPanY(panStartRef.current.panY + dy / zoomState.level);
    },
    [zoomState.level],
  );

  const handlePanEnd = useCallback(() => {
    panStartRef.current = null;
  }, []);

  // ─── Focus on a canvas-space point ─────────────────────────────────────────

  /**
   * Center the viewport on a canvas-space point at the given zoom level.
   * Computes pan so that (canvasX, canvasY) appears at the center of the
   * canvas element.
   */
  const focusOnPoint = useCallback(
    (canvasX: number, canvasY: number, zoom: number) => {
      const el = canvasRef.current;
      if (!el) return;
      const newZoom = clampZoom(zoom);
      const rect = el.getBoundingClientRect();
      // Pan such that canvasPoint maps to the viewport center:
      //   screenCenter = canvasOrigin + zoom * (canvasPoint + pan)
      //   pan = screenCenter / zoom - canvasPoint
      const newPanX = rect.width / 2 / newZoom - canvasX;
      const newPanY = rect.height / 2 / newZoom - canvasY;
      setZoom(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
    },
    [canvasRef, setZoom],
  );

  // ─── Reset ───────────────────────────────────────────────────────────────────

  const resetView = useCallback(() => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  }, [setZoom]);

  // ─── CSS transform string ─────────────────────────────────────────────────────

  const transformStyle = useMemo(
    () => getViewportTransform(zoomState.level, panX, panY),
    [zoomState.level, panX, panY],
  );

  return {
    viewport,
    transformStyle,
    screenToCanvas,
    zoomToward,
    focusOnPoint,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    resetView,
  };
}
