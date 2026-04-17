import React from 'react';
import type { Table } from '@/types/seating';
import { useSeating } from '@/hooks/useSeating';

export interface TableShapeProps {
  table: Table;
  width: number;
  height: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isDragging: boolean;
}

export const TableShape = ({
  table,
  width,
  height,
  isSelected,
  isHighlighted,
  isDragging,
}: TableShapeProps) => {
  const { isDraggingGuest } = useSeating();
  const isFull = table.guests.length >= table.maxChairs;
  const isRound = table.shape === 'round';

  // Build the ring / border class set.  Precedence (highest → lowest):
  //   1. isDraggingGuest — capacity drop-zone feedback (green/red)
  //   2. isHighlighted  — subtle drop-target feedback
  //   3. isSelected  — normal selection ring
  //   4. default border
  const ringClasses = (() => {
    if (isDraggingGuest) {
      return isFull
        ? 'border-destructive/70 ring-2 ring-destructive/30'
        : 'border-success/70 ring-2 ring-success/30';
    }
    if (isHighlighted) {
      return 'border-primary/60';
    }
    if (isSelected) {
      return 'ring-2 ring-primary/30 border-primary shadow-lg';
    }
    return 'border-foreground/25 hover:border-foreground/35';
  })();

  const shadowClasses = isDragging ? 'shadow-xl cursor-grabbing' : 'shadow-md cursor-grab';

  return (
    <div
      className={`bg-background flex items-center justify-center border-2 text-center transition-all duration-200 select-none ${
        isRound ? 'rounded-full' : 'rounded-lg'
      } ${ringClasses} ${shadowClasses}`}
      style={{ width, height }}
    >
      <span className="text-foreground text-base leading-none font-bold">{table.tableNumber}</span>
    </div>
  );
};
