import React, { useState, useEffect } from 'react';
import type { Guest } from '@/types/seating';
import { useSeating } from '@/hooks/useSeating';
import { useTableAssignment } from '@/hooks/useTableAssignment';
import { ArrowRightToLine } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GuestCardProps {
  guest: Guest;
  onDragStart: (e: React.DragEvent, guest: Guest) => void;
}

export const GuestCard = ({ guest, onDragStart }: GuestCardProps) => {
  const { seatingData, setIsDraggingGuest } = useSeating();
  const { assign } = useTableAssignment();
  const [isDragging, setIsDragging] = useState(false);

  const handleAssignToTable = async (tableId: string) => {
    await assign({ type: 'guest', guestId: guest.id }, tableId);
  };

  useEffect(() => {
    return () => setIsDraggingGuest(false);
  }, [setIsDraggingGuest]);

  const mealLabel =
    guest.mealSelection && guest.mealSelection !== 'No Meal Selected'
      ? `, meal: ${guest.mealSelection}`
      : '';

  return (
    <div
      role="listitem"
      draggable
      tabIndex={0}
      aria-label={`${guest.fullName}, party: ${guest.party}${mealLabel}`}
      onDragStart={(e) => {
        setIsDraggingGuest(true);
        setIsDragging(true);
        onDragStart(e, guest);
      }}
      onDragEnd={() => {
        setIsDraggingGuest(false);
        setIsDragging(false);
      }}
      className={`group focus-visible:ring-primary cursor-move rounded-lg border p-2 shadow-xs transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-hidden ${
        isDragging
          ? 'border-primary/40 bg-muted/30 border-dashed opacity-40'
          : 'border-border bg-card hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-foreground truncate font-medium">{guest.fullName}</div>
          <div className="text-muted-foreground mt-1 text-sm">{guest.party}</div>
        </div>

        {/* Keyboard-accessible assign-to-table dropdown */}
        {seatingData.tables.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={`Assign ${guest.fullName} to a table`}
                className="focus-visible:ring-primary hover:bg-muted ml-2 rounded p-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:outline-hidden"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <ArrowRightToLine
                  className="text-muted-foreground h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Assign to table</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {seatingData.tables.map((table) => {
                const isFull = table.guests.length >= table.maxChairs;
                return (
                  <DropdownMenuItem
                    key={table.id}
                    disabled={isFull}
                    onSelect={() => handleAssignToTable(table.id)}
                  >
                    <span className="flex-1">{table.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {table.guests.length}/{table.maxChairs}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
