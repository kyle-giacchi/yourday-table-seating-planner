import React, { useRef, useState } from 'react';
import type { Table, Guest } from '@/types/seating';
import { parseTableDimensions } from '@/components/seating/utils/dimensionParser';
import { useSeating } from '@/hooks/useSeating';
import { getPartyColor } from '@/utils/partyColor';
import { startGuestDrag } from '@/utils/dragUtils';
import { parseDragData } from '@/types/dragDrop';
import { previewPartyBlock } from '@/utils/seatingModel';
import { CapacityPill } from './CapacityPill';
import { SplitPartyModal } from '@/components/common/SplitPartyModal';

interface TableVisualCardProps {
  table: Table;
  onDrop: (e: React.DragEvent, tableId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
}

const VIEWPORT_W = 280;
const VIEWPORT_H = 220;
const SEAT_SIZE = 22;
const HIT_SIZE = 44;

const firstInitial = (fullName: string): string => {
  const trimmed = fullName.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
};

const shortName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  return parts[0] ?? '';
};

const seatLabel = (fullName: string, capacity: number): string => {
  if (capacity <= 6 && fullName.length <= 16) return fullName;
  return shortName(fullName);
};

interface SeatLayout {
  dotX: number;
  dotY: number;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'middle' | 'end';
}

const computeRoundSeats = (
  cx: number,
  cy: number,
  tableRadius: number,
  seatCount: number,
): SeatLayout[] => {
  const dotOrbit = tableRadius + 24;
  const labelOrbit = tableRadius + 44;
  return Array.from({ length: seatCount }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / seatCount;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return {
      dotX: cx + dotOrbit * cosA,
      dotY: cy + dotOrbit * sinA,
      labelX: cx + labelOrbit * cosA,
      labelY: cy + labelOrbit * sinA,
      anchor: Math.abs(cosA) < 0.01 ? 'middle' : cosA > 0 ? 'start' : 'end',
    };
  });
};

const computeRectSeats = (
  tableX: number,
  tableY: number,
  tableW: number,
  tableH: number,
  seatCount: number,
): SeatLayout[] => {
  const topCount = Math.ceil(seatCount / 2);
  const bottomCount = Math.floor(seatCount / 2);
  const seats: SeatLayout[] = [];
  const dotOffset = 22;
  const labelOffset = 42;

  for (let i = 0; i < topCount; i++) {
    const x = tableX + (tableW / (topCount + 1)) * (i + 1);
    seats.push({
      dotX: x,
      dotY: tableY - dotOffset,
      labelX: x,
      labelY: tableY - labelOffset,
      anchor: 'middle',
    });
  }
  for (let i = bottomCount - 1; i >= 0; i--) {
    const x = tableX + (tableW / (bottomCount + 1)) * (i + 1);
    seats.push({
      dotX: x,
      dotY: tableY + tableH + dotOffset,
      labelX: x,
      labelY: tableY + tableH + labelOffset,
      anchor: 'middle',
    });
  }
  return seats;
};

const labelTransform = (anchor: 'start' | 'middle' | 'end'): string => {
  if (anchor === 'start') return 'translateY(-50%)';
  if (anchor === 'end') return 'translate(-100%, -50%)';
  return 'translate(-50%, -50%)';
};

interface SeatSlotProps {
  seat: SeatLayout;
  index: number;
  guest: Guest | undefined;
  capacity: number;
  tableId: string;
  isPreview: boolean;
  previewColor: string | null;
}

const SeatSlot = ({
  seat,
  index,
  guest,
  capacity,
  tableId,
  isPreview,
  previewColor,
}: SeatSlotProps) => {
  const { setIsDraggingGuest, setIsDraggingSeated, setSeatDragInfo } = useSeating();

  if (!guest) {
    const previewStyle =
      isPreview && previewColor
        ? { borderColor: previewColor, color: previewColor, background: `${previewColor}22` }
        : undefined;
    return (
      <div
        className={`pointer-events-none absolute flex items-center justify-center rounded-full border-[1.5px] border-dashed text-[11px] transition-all duration-100 ${
          isPreview ? 'scale-125 font-bold' : 'border-muted-foreground/45 text-muted-foreground'
        }`}
        style={{
          left: seat.dotX,
          top: seat.dotY,
          width: SEAT_SIZE,
          height: SEAT_SIZE,
          transform: 'translate(-50%, -50%)',
          ...previewStyle,
        }}
        aria-label={`Empty seat ${index + 1}`}
      >
        {index + 1}
      </div>
    );
  }

  const color = getPartyColor(guest.party);
  const tooltip = `${guest.fullName}${guest.party ? ` — ${guest.party}` : ''}\nDrag to reorder party or drag to assign panel to unassign`;

  return (
    <>
      <div
        draggable
        title={tooltip}
        aria-label={`${guest.fullName}, ${guest.party ?? 'no party'}.`}
        onDragStart={(e) => {
          setIsDraggingGuest(true);
          setIsDraggingSeated(true);
          setSeatDragInfo({ partyName: guest.party, sourceTableId: tableId });
          startGuestDrag(e, guest, tableId);
        }}
        onDragEnd={() => {
          setIsDraggingGuest(false);
          setIsDraggingSeated(false);
          setSeatDragInfo(null);
        }}
        className="absolute flex cursor-grab items-center justify-center active:cursor-grabbing"
        style={{
          left: seat.dotX,
          top: seat.dotY,
          width: HIT_SIZE,
          height: HIT_SIZE,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className={`flex items-center justify-center rounded-full text-[11px] font-bold text-white shadow-xs transition-all duration-100 ${
            isPreview ? 'scale-125 ring-2 ring-offset-2' : ''
          }`}
          style={{
            background: color,
            width: SEAT_SIZE,
            height: SEAT_SIZE,
            ...(isPreview && previewColor
              ? ({ '--tw-ring-color': previewColor } as React.CSSProperties)
              : {}),
          }}
        >
          {firstInitial(guest.fullName)}
        </div>
      </div>
      <div
        className="text-foreground pointer-events-none absolute text-[11px] whitespace-nowrap"
        style={{
          left: seat.labelX,
          top: seat.labelY,
          transform: labelTransform(seat.anchor),
        }}
      >
        {seatLabel(guest.fullName, capacity)}
      </div>
    </>
  );
};

const cardSurfaceClass = (occupancy: number, recommended: number, max: number): string => {
  if (occupancy === 0) return 'bg-card opacity-75';
  if (occupancy > max) return 'bg-destructive/5';
  if (occupancy > recommended) return 'bg-warning/5';
  if (occupancy >= recommended) return 'bg-success/5';
  return 'bg-card';
};

const seatPreview = (
  table: Table,
  info: { partyName: string; sourceTableId: string } | null,
  hoveredSeatIndex: number | null,
) =>
  info?.sourceTableId === table.id
    ? previewPartyBlock(table.guests, info.partyName, hoveredSeatIndex)
    : null;

interface PendingReorder {
  partyName: string;
  targetIndex: number;
  splitPartyName: string;
}

export const TableVisualCard = ({ table, onDrop, onDragOver }: TableVisualCardProps) => {
  const { isDraggingGuest, reorderPartyInTable, seatDragInfo } = useSeating();
  const [dragDepth, setDragDepth] = useState(0);
  const [hoveredSeatIndex, setHoveredSeatIndex] = useState<number | null>(null);
  const [pendingReorder, setPendingReorder] = useState<PendingReorder | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isOver = dragDepth > 0;

  // Landing-zone preview: highlight the range of seats where the moving party will land
  const previewRange = seatPreview(table, seatDragInfo, hoveredSeatIndex);
  const previewColor = seatDragInfo ? getPartyColor(seatDragInfo.partyName) : null;
  const isInPreview = (i: number) =>
    previewRange !== null && i >= previewRange.start && i <= previewRange.end;

  const isRound = table.shape === 'round';
  const dims = parseTableDimensions(table.tableSize, isRound);
  const occupancy = table.guests.length;
  const capacity = table.capacity;

  const scale = isRound
    ? Math.min(58 / (dims.width / 2), 1.2)
    : Math.min(180 / dims.width, 68 / dims.height, 1.5);

  const tableW = dims.width * scale;
  const tableH = dims.height * scale;
  const cx = VIEWPORT_W / 2;
  const cy = VIEWPORT_H / 2;

  const seats = isRound
    ? computeRoundSeats(cx, cy, tableW / 2, capacity)
    : computeRectSeats(cx - tableW / 2, cy - tableH / 2, tableW, tableH, capacity);

  const dragRing = isOver
    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    : isDraggingGuest
      ? 'ring-2 ring-primary/30'
      : '';

  const surfaceClass = cardSurfaceClass(occupancy, table.defaultChairs, table.maxChairs);

  const tableFill = isOver ? 'hsl(var(--primary) / 0.18)' : 'hsl(var(--muted))';
  const tableStroke = isOver ? 'hsl(var(--primary))' : 'hsl(var(--border))';
  const tableStrokeDash = isOver ? '5 3' : undefined;

  // Parse drag data to detect intra-table reorder vs cross-table/panel assign
  const handleSeatDrop = (e: React.DragEvent, targetIndex: number) => {
    setHoveredSeatIndex(null);
    setDragDepth(0);
    const data = parseDragData(e.dataTransfer.getData('application/json'));
    const partyName = data?.sourceTableId === table.id ? data.partyName : undefined;
    // Cross-table or from-panel drop — defer to card-level assign logic
    if (!partyName) return onDrop(e, table.id);

    const preview = previewPartyBlock(table.guests, partyName, targetIndex);
    if (preview?.splitPartyName) {
      setPendingReorder({
        partyName,
        targetIndex: preview.target,
        splitPartyName: preview.splitPartyName,
      });
      return;
    }
    reorderPartyInTable(table.id, partyName, targetIndex); // clamps; no-op if party absent
  };

  return (
    <div
      className={`border-border rounded-lg border p-4 shadow-xs transition-all duration-150 hover:shadow-md ${surfaceClass} ${dragRing}`}
      onDrop={(e) => {
        setDragDepth(0);
        onDrop(e, table.id);
      }}
      onDragOver={onDragOver}
      onDragEnter={() => setDragDepth((d) => d + 1)}
      onDragLeave={() => setDragDepth((d) => Math.max(0, d - 1))}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-foreground truncate font-semibold">
          {table.name || `Table ${table.id.replace('table-', '')}`}
        </h3>
        <CapacityPill
          occupancy={occupancy}
          recommended={table.defaultChairs}
          max={table.maxChairs}
        />
      </div>
      <div className="text-muted-foreground mb-2 text-xs">
        {table.tableSize}
        {table.commonUse ? ` • ${table.commonUse}` : ''}
      </div>

      {occupancy === 0 && (
        <div className="text-muted-foreground mb-1 text-center text-[11px] italic">
          Drop guests or parties here
        </div>
      )}

      <div
        ref={viewportRef}
        className="relative mx-auto"
        style={{ width: VIEWPORT_W, height: VIEWPORT_H }}
        onDragOver={(e) => {
          // Only hijack dragover for same-table reorders; let other drops use card-level handler
          if (!seatDragInfo || seatDragInfo.sourceTableId !== table.id || seats.length === 0) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          const rect = viewportRef.current?.getBoundingClientRect();
          if (!rect) return;
          const localX = e.clientX - rect.left;
          const localY = e.clientY - rect.top;
          let nearest = 0;
          let minDistSq = Infinity;
          for (let i = 0; i < seats.length; i++) {
            const dx = localX - seats[i].dotX;
            const dy = localY - seats[i].dotY;
            const d = dx * dx + dy * dy;
            if (d < minDistSq) {
              minDistSq = d;
              nearest = i;
            }
          }
          if (hoveredSeatIndex !== nearest) setHoveredSeatIndex(nearest);
        }}
        onDragLeave={(e) => {
          const rect = viewportRef.current?.getBoundingClientRect();
          if (!rect) return;
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          ) {
            setHoveredSeatIndex(null);
          }
        }}
        onDrop={(e) => {
          if (!seatDragInfo || seatDragInfo.sourceTableId !== table.id) return;
          e.preventDefault();
          e.stopPropagation();
          const targetIdx = hoveredSeatIndex ?? 0;
          handleSeatDrop(e, targetIdx);
        }}
      >
        <svg
          width={VIEWPORT_W}
          height={VIEWPORT_H}
          viewBox={`0 0 ${VIEWPORT_W} ${VIEWPORT_H}`}
          className="absolute inset-0"
          aria-hidden="true"
        >
          {isRound ? (
            <circle
              cx={cx}
              cy={cy}
              r={tableW / 2}
              fill={tableFill}
              stroke={tableStroke}
              strokeWidth={2}
              strokeDasharray={tableStrokeDash}
            />
          ) : (
            <rect
              x={cx - tableW / 2}
              y={cy - tableH / 2}
              width={tableW}
              height={tableH}
              rx={6}
              fill={tableFill}
              stroke={tableStroke}
              strokeWidth={2}
              strokeDasharray={tableStrokeDash}
            />
          )}
        </svg>

        {seats.map((seat, i) => (
          <SeatSlot
            key={`seat-${i}`}
            seat={seat}
            index={i}
            guest={table.guests[i]}
            capacity={capacity}
            tableId={table.id}
            isPreview={isInPreview(i)}
            previewColor={previewColor}
          />
        ))}
      </div>

      {pendingReorder && (
        <SplitPartyModal
          isOpen={true}
          onClose={() => setPendingReorder(null)}
          onConfirm={() => {
            reorderPartyInTable(table.id, pendingReorder.partyName, pendingReorder.targetIndex);
            setPendingReorder(null);
          }}
          splitPartyName={pendingReorder.splitPartyName}
          movingPartyName={pendingReorder.partyName}
        />
      )}
    </div>
  );
};
