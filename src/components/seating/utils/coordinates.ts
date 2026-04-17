import type { Table } from '@/types/seating';
import type { CanvasPoint } from '../types';

/**
 * Convert a screen-space coordinate (e.g. from a mouse event) to a canvas-space
 * coordinate, accounting for the canvas element's position, current zoom level,
 * and pan offsets.
 *
 * The CSS transform applied to the inner container is:
 *   scale(zoom) translate(panX, panY)
 *
 * CSS applies transforms right-to-left, so the effective mapping is:
 *   screen = canvasOrigin + zoom * (canvasPoint + pan)
 *
 * Solving for canvasPoint:
 *   canvasPoint = (screen - canvasOrigin) / zoom - pan
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  canvasRect: DOMRect,
  zoom: number,
  panX: number,
  panY: number,
): CanvasPoint {
  return {
    x: (screenX - canvasRect.left) / zoom - panX,
    y: (screenY - canvasRect.top) / zoom - panY,
  };
}

/**
 * Convert a canvas-space coordinate to a screen-space coordinate — the inverse
 * of `screenToCanvas`.
 *
 *   screen = canvasOrigin + zoom * (canvasPoint + pan)
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  canvasRect: DOMRect,
  zoom: number,
  panX: number,
  panY: number,
): CanvasPoint {
  return {
    x: canvasRect.left + zoom * (canvasX + panX),
    y: canvasRect.top + zoom * (canvasY + panY),
  };
}

/**
 * Find the table whose centre is closest to the given canvas-space point.
 * Returns `null` when no table falls within `maxDistance` canvas pixels.
 */
export function findClosestTable(
  point: CanvasPoint,
  tables: Table[],
  maxDistance: number,
): Table | null {
  let closest: Table | null = null;
  let closestDistance = Infinity;

  for (const table of tables) {
    const dx = table.x - point.x;
    const dy = table.y - point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < closestDistance) {
      closestDistance = distance;
      closest = table;
    }
  }

  return closestDistance <= maxDistance ? closest : null;
}

/**
 * Build the CSS transform string that should be applied to the canvas inner
 * container element.
 *
 * Order: scale first (origin top-left), then translate.  Because CSS applies
 * transforms in right-to-left order, this means the translate is applied in
 * the already-scaled coordinate space — which is exactly what we want when
 * panX/panY are expressed in pre-zoom canvas pixels.
 */
export function getViewportTransform(zoom: number, panX: number, panY: number): string {
  return `scale(${zoom}) translate(${panX}px, ${panY}px)`;
}
