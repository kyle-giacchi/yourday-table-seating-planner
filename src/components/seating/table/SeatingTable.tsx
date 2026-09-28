import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { Table } from '@/types/seating';
import { useSeating } from '@/hooks/useSeating';
import { useTableAssignment } from '@/hooks/useTableAssignment';
import { useTableDimensions } from '../hooks/useTableDimensions';

import type { CanvasPoint } from '../types';
import { TableShape } from './TableShape';
import { SeatDots } from './SeatDots';
import { TableInfoPill } from './TableInfoPill';
import { useTableDrag } from './useTableDrag';

export interface SeatingTableProps {
  table: Table;
  /** When true the table renders with a green glow to signal it is a valid drop target. */
  isHighlighted?: boolean;
  /** Coordinate transform from the viewport — converts screen coords to canvas coords. */
  screenToCanvas: (screenX: number, screenY: number, canvasRect: DOMRect) => CanvasPoint;
}

const PILL_FADE_DELAY = 2000;

const SeatingTableComponent = ({
  table,
  isHighlighted = false,
  screenToCanvas,
}: SeatingTableProps) => {
  const {
    selectTable,
    selectedTableId,
    getTableScale,
    hoveredGuestId,
    showGuestPositionsTableId,
    guestPositionColorMap,
    setManagementMode,
    pinAllPills,
  } = useSeating();
  const { dropOnTable } = useTableAssignment();

  const isRound = table.shape === 'round';
  const isSelected = selectedTableId === table.id;

  // --- Pill visibility state ---
  const [pillVisible, setPillVisible] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveringRef = useRef(false);

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const startFadeTimer = useCallback(() => {
    clearFadeTimer();
    fadeTimerRef.current = setTimeout(() => {
      if (!hoveringRef.current) {
        setPillVisible(false);
      }
    }, PILL_FADE_DELAY);
  }, [clearFadeTimer]);

  // Clean up timer on unmount
  useEffect(() => clearFadeTimer, [clearFadeTimer]);

  const handleTableClick = useCallback(() => {
    setPillVisible(true);
    clearFadeTimer();
  }, [clearFadeTimer]);

  const handleMouseEnterZone = useCallback(() => {
    hoveringRef.current = true;
    clearFadeTimer();
  }, [clearFadeTimer]);

  const handleMouseLeaveZone = useCallback(() => {
    hoveringRef.current = false;
    if (pillVisible) {
      startFadeTimer();
    }
  }, [pillVisible, startFadeTimer]);

  // --- Dimensions ---
  const tableDimensions = useTableDimensions({
    tableSize: table.tableSize,
    tableId: table.id,
    isRound,
    getTableScale,
  });

  // --- Drag + recently-assigned state ---
  const { isDragging, recentlyAssigned, wasDragged, handleMouseDown } = useTableDrag({
    tableId: table.id,
    tableDimensions,
    screenToCanvas,
  });

  // --- Event handlers ---
  const handleSettingsClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      selectTable(table.id);
      setManagementMode('table-editor');
    },
    [selectTable, setManagementMode, table.id],
  );

  const handleTableDrop = (e: React.DragEvent) => {
    void dropOnTable(e, table.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleMouseDown(e, table.x, table.y);
    },
    [handleMouseDown, table.x, table.y],
  );

  // No manual useCallback here: react-compiler can auto-memoize this handler
  // cleanly, and manual memo conflicts with `wasDragged.current` ref access.
  const onMouseUp = () => {
    // Only show pill on click (mouseup without actual mouse movement)
    if (!wasDragged.current) {
      handleTableClick();
    }
  };

  // --- Keyboard handler for accessibility ---
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTableClick();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPillVisible(false);
        selectTable(null);
      }
    },
    [handleTableClick, selectTable],
  );

  // Build accessible label
  const tableName = table.name || `Table ${table.tableNumber}`;
  const ariaLabel = `${tableName}: ${table.guests.length} of ${table.defaultChairs} guests seated`;

  return (
    <div
      data-table-id={table.id}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-selected={isSelected}
      className={`focus-visible:ring-primary pointer-events-auto absolute rounded transition-shadow duration-200 select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden ${
        isDragging ? 'z-20' : 'z-2'
      }`}
      style={{ left: table.x, top: table.y }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onKeyDown={handleKeyDown}
      onDrop={handleTableDrop}
      onDragOver={handleDragOver}
      onMouseEnter={handleMouseEnterZone}
      onMouseLeave={handleMouseLeaveZone}
    >
      {/* Floating info pill */}
      <TableInfoPill
        tableNumber={table.tableNumber}
        tableName={tableName}
        guestCount={table.guests.length}
        defaultChairs={table.defaultChairs}
        visible={pinAllPills || pillVisible}
        onSettingsClick={handleSettingsClick}
        onMouseEnter={handleMouseEnterZone}
        onMouseLeave={handleMouseLeaveZone}
      />

      {/*
        SeatDots are absolutely positioned relative to this wrapper, so they
        can extend beyond the table bounds for round tables.
      */}
      <SeatDots
        tableWidth={tableDimensions.width}
        tableHeight={tableDimensions.height}
        isRound={isRound}
        guestCount={table.guests.length}
        defaultChairs={table.defaultChairs}
        guests={table.guests}
        recentlyAssigned={recentlyAssigned}
        highlightedSeatIndex={
          hoveredGuestId ? table.guests.findIndex((g) => g.id === hoveredGuestId) : null
        }
        showPositions={showGuestPositionsTableId === table.id}
        guestPositionColorMap={guestPositionColorMap}
      />

      <TableShape
        table={table}
        width={tableDimensions.width}
        height={tableDimensions.height}
        isSelected={isSelected}
        isHighlighted={isHighlighted}
        isDragging={isDragging}
      />
    </div>
  );
};

export const SeatingTable = React.memo(SeatingTableComponent);
