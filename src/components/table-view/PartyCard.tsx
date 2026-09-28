import React, { useState, useEffect } from 'react';
import type { EnhancedParty } from '@/utils/partyUtils';
import { ArrowRightToLine, Split } from 'lucide-react';
import { useSeating } from '@/hooks/useSeating';
import { useTableAssignment } from '@/hooks/useTableAssignment';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PartyCardProps {
  party: EnhancedParty;
  onDragStart: (e: React.DragEvent, party: EnhancedParty) => void;
}

export const PartyCard = ({ party, onDragStart }: PartyCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { setIsDraggingGuest, seatingData } = useSeating();
  const { assign } = useTableAssignment();

  useEffect(() => {
    return () => setIsDraggingGuest(false);
  }, [setIsDraggingGuest]);

  const handleAssignToTable = async (tableId: string) => {
    await assign({ type: 'party', partyName: party.name }, tableId);
  };

  const getCardStyling = () => {
    const base =
      'group focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-hidden';
    if (isDragging) {
      return `p-2 rounded-lg border-2 border-dashed border-primary/40 bg-muted/30 shadow-xs cursor-move transition-all duration-200 opacity-40 ${base}`;
    }
    if (party.isPartiallyAssigned) {
      return `p-2 bg-warning/10 rounded-lg border-2 border-dashed border-warning/40 shadow-xs cursor-move hover:shadow-md hover:border-warning/60 hover:-translate-y-0.5 transition-all duration-200 ${base}`;
    }
    return `p-2 bg-card rounded-lg border border-border shadow-xs cursor-move hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 ${base}`;
  };

  const getBadgeStyling = () => {
    if (party.isPartiallyAssigned) {
      return 'text-sm font-medium text-warning bg-warning/15 px-2 py-1 rounded-full';
    }
    return 'text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-full';
  };

  const getDisplayText = () => {
    if (party.isPartiallyAssigned) {
      return `${party.unassignedCount} of ${party.originalSize}`;
    }
    return party.size.toString();
  };

  return (
    <div
      role="listitem"
      draggable
      tabIndex={0}
      aria-label={`${party.name}, ${party.isPartiallyAssigned ? `${party.unassignedCount} of ${party.originalSize} guests remaining` : `${party.size} guests`}`}
      onDragStart={(e) => {
        setIsDraggingGuest(true);
        setIsDragging(true);
        onDragStart(e, party);
      }}
      onDragEnd={() => {
        setIsDraggingGuest(false);
        setIsDragging(false);
      }}
      className={getCardStyling()}
      title={
        party.isPartiallyAssigned
          ? `${party.assignedCount} guests already assigned, ${party.unassignedCount} remaining`
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-foreground truncate font-medium">{party.name}</span>
          {party.isPartiallyAssigned && (
            <div title="Partially assigned party">
              <Split className="text-warning h-3 w-3" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className={getBadgeStyling()}>{getDisplayText()}</span>
          {seatingData.tables.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label={`Assign ${party.name} to a table`}
                  className="focus-visible:ring-primary hover:bg-muted rounded p-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:outline-hidden"
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
                  const seatsLeft = table.maxChairs - table.guests.length;
                  const wontFit = seatsLeft < party.unassignedCount;
                  return (
                    <DropdownMenuItem
                      key={table.id}
                      disabled={wontFit}
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
    </div>
  );
};
