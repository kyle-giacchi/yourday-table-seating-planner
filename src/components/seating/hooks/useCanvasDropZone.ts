import { useState, useCallback } from 'react';
import { useSeating } from '@/hooks/useSeating';
import { useTableAssignment } from '@/hooks/useTableAssignment';
import type { Table } from '@/types/seating';
import type { CanvasPoint } from '../types';
import { findClosestTable } from '../utils/coordinates';

/** Maximum canvas-pixel distance from a table centre that still counts as a drop target. */
const MAX_DROP_DISTANCE = 100;

interface UseCanvasDropZoneOptions {
  /** Called with a screen-space coordinate; must return the matching canvas-space point. */
  screenToCanvas: (screenX: number, screenY: number, canvasRect: DOMRect) => CanvasPoint;
  /** Supply an explicit table list; falls back to `seatingData.tables` when omitted. */
  tables?: Table[];
}

/**
 * useCanvasDropZone
 *
 * Handles canvas-level drag-and-drop. When the user drops a
 * guest or party anywhere on the canvas, this hook finds the nearest table
 * (within `MAX_DROP_DISTANCE` canvas pixels) and hands the drop to the shared
 * assignment module (`useTableAssignment`), which owns capacity checks and toasts.
 *
 * It also tracks the ID of the "highlighted" table — the closest valid drop
 * target during an active drag — so the canvas renderer can show visual
 * feedback without any extra state.
 */
export function useCanvasDropZone({
  screenToCanvas,
  tables: tablesProp,
}: UseCanvasDropZoneOptions) {
  const { seatingData } = useSeating();
  const { dropOnTable } = useTableAssignment();

  const [highlightedTableId, setHighlightedTableId] = useState<string | null>(null);

  // Use the caller-supplied table list when provided; otherwise fall back to context.
  const resolveTables = useCallback(
    (): Table[] => (tablesProp !== undefined ? tablesProp : seatingData.tables),
    [tablesProp, seatingData.tables],
  );

  /**
   * Resolve the canvas-space position for a drag event and return the closest
   * table within range, or null.
   */
  const resolveDropTarget = useCallback(
    (e: React.DragEvent): Table | null => {
      const canvasEl = e.currentTarget as HTMLDivElement;
      const rect = canvasEl.getBoundingClientRect();
      const canvasPoint = screenToCanvas(e.clientX, e.clientY, rect);
      return findClosestTable(canvasPoint, resolveTables(), MAX_DROP_DISTANCE);
    },
    [screenToCanvas, resolveTables],
  );

  /**
   * handleDragOver
   *
   * Signals that the canvas accepts drops and updates `highlightedTableId` with
   * the closest eligible table so the UI can render a drop-target indicator.
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const closest = resolveDropTarget(e);
      setHighlightedTableId(closest ? closest.id : null);
    },
    [resolveDropTarget],
  );

  /**
   * handleDrop
   *
   * Finds the closest table and forwards the drop to `dropOnTable`.
   * Clears the highlight regardless of success or failure.
   */
  const handleDrop = useCallback(
    async (e: React.DragEvent): Promise<boolean> => {
      e.preventDefault();
      setHighlightedTableId(null);

      const target = resolveDropTarget(e);
      if (!target) return false;

      return dropOnTable(e, target.id);
    },
    [resolveDropTarget, dropOnTable],
  );

  /**
   * handleDragLeave
   *
   * Clears the highlight when the drag leaves the canvas entirely.
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear when leaving the canvas itself, not a child element.
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setHighlightedTableId(null);
    }
  }, []);

  return {
    handleDrop,
    handleDragOver,
    handleDragLeave,
    highlightedTableId,
  };
}
