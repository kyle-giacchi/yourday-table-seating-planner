import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { useSeating } from '@/hooks/useSeating';
import { toast } from '@/hooks/use-toast';
import type { Table as TableType } from '@/types/seating';

export interface DragReorderHandlers {
  dragIndex: number | null;
  dropIndex: number | null;
  handleDragStart: (e: React.DragEvent, guestId: string, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDrop: (e: React.DragEvent, targetIndex: number) => void;
  handleDragEnd: () => void;
}

export const useGuestDragReorder = (
  tableId: string,
  reorderGuestInTable: (tableId: string, guestId: string, targetIndex: number) => void,
): DragReorderHandlers => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragGuestIdRef = useRef<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, guestId: string, _index: number) => {
    dragGuestIdRef.current = guestId;
    setDragIndex(_index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (dragGuestIdRef.current) {
        reorderGuestInTable(tableId, dragGuestIdRef.current, targetIndex);
      }
      dragGuestIdRef.current = null;
      setDragIndex(null);
      setDropIndex(null);
    },
    [reorderGuestInTable, tableId],
  );

  const handleDragEnd = useCallback(() => {
    dragGuestIdRef.current = null;
    setDragIndex(null);
    setDropIndex(null);
  }, []);

  return { dragIndex, dropIndex, handleDragStart, handleDragOver, handleDrop, handleDragEnd };
};

export interface TableActions {
  showPositions: boolean;
  handleRemoveGuest: (guestId: string) => void;
  handleDeleteTable: () => void;
  handleClose: () => void;
  handleTogglePositions: () => void;
}

export const useTableActions = (table: TableType, onClose: () => void): TableActions => {
  const {
    removeTable,
    removeGuestFromTable,
    showGuestPositionsTableId,
    setShowGuestPositionsTableId,
    setGuestPositionColorMap,
  } = useSeating();

  const showPositions = showGuestPositionsTableId === table.id;

  const handleRemoveGuest = (guestId: string) => {
    removeGuestFromTable(guestId);
    toast({ title: 'Success', description: 'Guest removed from table' });
  };

  const handleDeleteTable = () => {
    setShowGuestPositionsTableId(null);
    setGuestPositionColorMap({});
    // removeTable now surfaces a toast with the moved-guest count when needed.
    // Only toast here for empty-table deletions so users always get confirmation.
    const wasEmpty = table.guests.length === 0;
    removeTable(table.id);
    onClose();
    if (wasEmpty) {
      toast({ title: 'Table deleted', description: 'The table has been removed.' });
    }
  };

  const handleClose = () => {
    setShowGuestPositionsTableId(null);
    setGuestPositionColorMap({});
    onClose();
  };

  const handleTogglePositions = () => {
    if (showPositions) {
      setShowGuestPositionsTableId(null);
      setGuestPositionColorMap({});
      return;
    }
    const colorMap: Record<string, number> = {};
    table.guests.forEach((guest, index) => {
      colorMap[guest.id] = index;
    });
    setGuestPositionColorMap(colorMap);
    setShowGuestPositionsTableId(table.id);
  };

  return {
    showPositions,
    handleRemoveGuest,
    handleDeleteTable,
    handleClose,
    handleTogglePositions,
  };
};
