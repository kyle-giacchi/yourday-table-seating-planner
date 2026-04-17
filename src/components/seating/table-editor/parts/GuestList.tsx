import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GripVertical, X } from 'lucide-react';
import type { Guest } from '@/types/seating';
import { getPositionColor } from '@/utils/positionColors';

interface GuestRowProps {
  guest: Guest;
  index: number;
  showPositions: boolean;
  colorIndex: number;
  isDragged: boolean;
  isOver: boolean;
  onDragStart: (e: React.DragEvent, guestId: string, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onRemove: (guestId: string) => void;
  onHover: (guestId: string | null) => void;
}

const GuestRow = ({
  guest,
  index,
  showPositions,
  colorIndex,
  isDragged,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
  onHover,
}: GuestRowProps) => {
  const posColor = getPositionColor(colorIndex);
  const baseClasses = !showPositions ? 'bg-muted border-transparent' : '';
  const draggedClasses = isDragged ? 'opacity-40' : '';
  const overClasses = isOver ? 'ring-primary ring-1' : '';
  const style = showPositions
    ? { backgroundColor: posColor.bg, borderColor: isOver ? undefined : posColor.border }
    : undefined;
  const textStyle = showPositions ? { color: posColor.text } : undefined;

  return (
    <div
      role="listitem"
      draggable
      onDragStart={(e) => onDragStart(e, guest.id, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-1.5 rounded border p-2 text-xs transition-opacity ${baseClasses}${draggedClasses}${overClasses}`}
      style={style}
      onMouseEnter={() => onHover(guest.id)}
      onMouseLeave={() => onHover(null)}
    >
      <GripVertical className="text-muted-foreground/50 h-3 w-3 shrink-0 cursor-grab" />
      {showPositions && (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: posColor.dot }}
        />
      )}
      <span
        className={`w-5 shrink-0 text-center font-mono ${showPositions ? 'font-bold' : 'text-muted-foreground'}`}
        style={textStyle}
      >
        #{index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium" style={textStyle}>
          {guest.fullName}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onRemove(guest.id)}
        aria-label={`Remove ${guest.fullName} from table`}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 h-5 w-5 shrink-0 p-0"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </Button>
    </div>
  );
};

interface GuestListProps {
  guests: Guest[];
  maxChairs: number;
  showPositions: boolean;
  guestPositionColorMap: Record<string, number>;
  dragIndex: number | null;
  dropIndex: number | null;
  onDragStart: (e: React.DragEvent, guestId: string, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onRemove: (guestId: string) => void;
  onHover: (guestId: string | null) => void;
}

export const GuestList = (props: GuestListProps) => {
  const { guests, maxChairs, showPositions, guestPositionColorMap, dragIndex, dropIndex } = props;
  const currentGuests = guests.length;

  return (
    <div className="space-y-2">
      <Label>
        Guests ({currentGuests}/{maxChairs})
      </Label>
      {currentGuests === 0 ? (
        <p className="text-muted-foreground bg-muted rounded p-2 text-xs italic">
          No guests assigned
        </p>
      ) : (
        <div
          className="max-h-48 space-y-1 overflow-y-auto"
          role="list"
          aria-label="Assigned guests"
        >
          {guests.map((guest, index) => {
            const mapped = guestPositionColorMap[guest.id];
            const colorIndex = showPositions && mapped != null ? mapped : index;
            return (
              <GuestRow
                key={guest.id}
                guest={guest}
                index={index}
                showPositions={showPositions}
                colorIndex={colorIndex}
                isDragged={dragIndex === index}
                isOver={dropIndex === index && dropIndex !== dragIndex}
                onDragStart={props.onDragStart}
                onDragOver={props.onDragOver}
                onDrop={props.onDrop}
                onDragEnd={props.onDragEnd}
                onRemove={props.onRemove}
                onHover={props.onHover}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
