import React, { useState } from 'react';
import type { Table, Guest } from '@/types/seating';
import { getPartiesFromGuests, getPartyAssignmentStatus } from '@/utils/partyUtils';
import { Split, X } from 'lucide-react';
import { useSeating } from '@/hooks/useSeating';
import type { TableDisplayMode } from './DisplayModeToggle';
import { CapacityPill } from './CapacityPill';
import { startGuestDrag, startPartyDrag } from '@/utils/dragUtils';
import { parseDragData } from '@/types/dragDrop';
import { findSplitPartyName } from '@/utils/tableReorder';
import { getPartyColor } from '@/utils/partyColor';
import { clamp } from '@/lib/utils';
import { SplitPartyModal } from '@/components/common/SplitPartyModal';

const EMPTY_GUESTS: Guest[] = [];
const EMPTY_TABLES: Table[] = [];

const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
};

interface PartyDisplayInfo {
  displayText: string;
  isPartial: boolean;
  tooltip: string | undefined;
}

const getPartyDisplayInfo = (
  partyName: string,
  partySize: number,
  unassignedGuests: Guest[],
  allTables: Table[],
): PartyDisplayInfo => {
  if (unassignedGuests.length > 0 || allTables.length > 0) {
    const status = getPartyAssignmentStatus(partyName, unassignedGuests, allTables);
    if (status.isPartiallyAssigned) {
      return {
        displayText: `${partyName} (${status.assignedCount} of ${status.originalSize})`,
        isPartial: true,
        tooltip: `${status.unassignedCount} guests from this party are still unassigned`,
      };
    }
  }
  return { displayText: `${partyName} (${partySize})`, isPartial: false, tooltip: undefined };
};

interface TableHeaderProps {
  tableName: string;
  occupancy: number;
  recommended: number;
  max: number;
}

const TableHeader = ({ tableName, occupancy, recommended, max }: TableHeaderProps) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    <h3 className="text-foreground truncate font-semibold">{tableName}</h3>
    <CapacityPill occupancy={occupancy} recommended={recommended} max={max} />
  </div>
);

interface PendingReorder {
  partyName: string;
  targetIndex: number;
  splitPartyName: string;
}

// -----------------------------------------------------------------------------
// By-Guest seat rows
// -----------------------------------------------------------------------------

interface SeatRowProps {
  index: number;
  guest: Guest | undefined;
  tableId: string;
  isPreview: boolean;
  previewColor: string | null;
  onRemove?: () => void;
}

const SeatRow = ({ index, guest, tableId, isPreview, previewColor, onRemove }: SeatRowProps) => {
  const { setIsDraggingGuest, setIsDraggingSeated, setSeatDragInfo } = useSeating();

  if (!guest) {
    const previewStyle =
      isPreview && previewColor
        ? { borderColor: previewColor, background: `${previewColor}14` }
        : undefined;
    return (
      <div
        className={`border-border/60 text-muted-foreground flex items-center gap-2 rounded border border-dashed px-2 py-1.5 text-sm transition-colors duration-100 ${
          isPreview ? 'border-solid' : ''
        }`}
        style={previewStyle}
      >
        <span className="bg-muted/50 text-muted-foreground inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium">
          {index + 1}
        </span>
        <span className="flex-1 italic">empty seat</span>
      </div>
    );
  }

  const partyColor = getPartyColor(guest.party);
  const rowPreviewStyle =
    isPreview && previewColor
      ? { boxShadow: `inset 0 0 0 2px ${previewColor}`, background: `${previewColor}1a` }
      : undefined;

  return (
    <div
      draggable
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
      title={`${guest.fullName}${guest.party ? ` — ${guest.party}` : ''}\nDrag to reorder party or drag to assign panel to unassign`}
      className="group bg-muted/40 border-border/60 flex cursor-grab items-center gap-2 rounded border px-2 py-1.5 text-sm transition-all duration-100 active:cursor-grabbing"
      style={rowPreviewStyle}
    >
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ background: partyColor }}
      >
        {getInitials(guest.fullName)}
      </span>
      <span className="text-foreground flex-1 truncate font-medium">{guest.fullName}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          onDragStart={(e) => e.preventDefault()}
          draggable={false}
          aria-label={`Remove ${guest.fullName} from table`}
          title={`Remove ${guest.fullName} from table`}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-ring inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-40 transition-all duration-150 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

const DropPlaceholder = ({ text }: { text: string }) => (
  <div className="border-border text-muted-foreground rounded border-2 border-dashed py-4 text-center text-sm">
    {text}
  </div>
);

// -----------------------------------------------------------------------------
// By-Party rows
// -----------------------------------------------------------------------------

interface PartyRowProps {
  partyName: string;
  partySize: number;
  tableId: string;
  info: PartyDisplayInfo;
  isDropTarget: boolean;
  showInsertionLine: boolean;
  onRemove: () => void;
}

const PartyRow = ({
  partyName,
  partySize,
  tableId,
  info,
  isDropTarget,
  showInsertionLine,
  onRemove,
}: PartyRowProps) => {
  const { setIsDraggingGuest, setIsDraggingSeated, setSeatDragInfo } = useSeating();

  return (
    <div className="relative">
      {showInsertionLine && (
        <div
          className="bg-primary absolute -top-1 right-0 left-0 h-0.5 rounded-full"
          aria-hidden="true"
        />
      )}
      <div
        draggable
        onDragStart={(e) => {
          setIsDraggingGuest(true);
          setIsDraggingSeated(true);
          setSeatDragInfo({ partyName, sourceTableId: tableId });
          startPartyDrag(e, partyName, partySize, tableId);
        }}
        onDragEnd={() => {
          setIsDraggingGuest(false);
          setIsDraggingSeated(false);
          setSeatDragInfo(null);
        }}
        title={info.tooltip ?? `Drag to reorder or drag to assign panel to unassign`}
        className={`group flex cursor-grab items-center justify-between gap-2 rounded px-3 py-2 transition-all duration-100 active:cursor-grabbing ${
          info.isPartial ? 'border-warning/30 bg-warning/10 border' : 'bg-muted/50'
        } ${isDropTarget ? 'ring-primary ring-2' : ''}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-foreground truncate text-sm font-medium">{info.displayText}</span>
          {info.isPartial && (
            <div title="Partially assigned party">
              <Split className="text-warning h-3 w-3 shrink-0" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          onDragStart={(e) => e.preventDefault()}
          draggable={false}
          aria-label={`Remove ${partyName} from table`}
          title={`Remove ${partyName} from table`}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-ring inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-40 transition-all duration-150 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

interface PartyListProps {
  table: Table;
  parties: ReturnType<typeof getPartiesFromGuests>;
  unassignedGuests: Guest[];
  allTables: Table[];
  onRemovePartyFromTable: (partyName: string, tableId: string) => void;
  hoveredPartyName: string | null;
  onPartyDragOver: (partyName: string, e: React.DragEvent) => void;
  onPartyDragLeave: () => void;
  onPartyDrop: (targetPartyName: string, e: React.DragEvent) => void;
  onListDrop: (e: React.DragEvent) => void;
  onListDragOver: (e: React.DragEvent) => void;
}

const PartyList = ({
  table,
  parties,
  unassignedGuests,
  allTables,
  onRemovePartyFromTable,
  hoveredPartyName,
  onPartyDragOver,
  onPartyDragLeave,
  onPartyDrop,
  onListDrop,
  onListDragOver,
}: PartyListProps) => {
  if (parties.length === 0) return <DropPlaceholder text="Drop parties here" />;
  return (
    <div className="space-y-2" onDragOver={onListDragOver} onDrop={onListDrop}>
      {parties.map((party) => (
        <div
          key={party.name}
          onDragOver={(e) => onPartyDragOver(party.name, e)}
          onDragLeave={onPartyDragLeave}
          onDrop={(e) => onPartyDrop(party.name, e)}
        >
          <PartyRow
            partyName={party.name}
            partySize={party.size}
            tableId={table.id}
            info={getPartyDisplayInfo(party.name, party.size, unassignedGuests, allTables)}
            isDropTarget={hoveredPartyName === party.name}
            showInsertionLine={hoveredPartyName === party.name}
            onRemove={() => onRemovePartyFromTable(party.name, table.id)}
          />
        </div>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Reorder drop handlers (shared across By Guest and By Party modes)
// -----------------------------------------------------------------------------

interface ReorderHandlerArgs {
  table: Table;
  draggedFromThisTable: boolean;
  seatDragInfo: { partyName: string; sourceTableId: string } | null;
  hoveredSeatIndex: number | null;
  hoveredPartyName: string | null;
  setHoveredSeatIndex: (i: number | null) => void;
  setHoveredPartyName: (name: string | null) => void;
  setDragDepth: (v: number) => void;
  tryReorderToIndex: (partyName: string, rawTargetIdx: number) => void;
}

const useReorderHandlers = (args: ReorderHandlerArgs) => {
  const {
    table,
    draggedFromThisTable,
    seatDragInfo,
    hoveredSeatIndex,
    hoveredPartyName,
    setHoveredSeatIndex,
    setHoveredPartyName,
    setDragDepth,
    tryReorderToIndex,
  } = args;

  const handleSeatRowDragOver = (seatIdx: number, e: React.DragEvent) => {
    if (!draggedFromThisTable) return;
    e.preventDefault();
    e.stopPropagation();
    if (hoveredSeatIndex !== seatIdx) setHoveredSeatIndex(seatIdx);
  };

  const handleSeatRowDrop = (seatIdx: number, e: React.DragEvent) => {
    const data = parseDragData(e.dataTransfer.getData('application/json'));
    if (!data || data.sourceTableId !== table.id || !data.partyName) return;
    e.preventDefault();
    e.stopPropagation();
    setHoveredSeatIndex(null);
    setDragDepth(0);
    tryReorderToIndex(data.partyName, seatIdx);
  };

  const handlePartyRowDragOver = (targetPartyName: string, e: React.DragEvent) => {
    if (!draggedFromThisTable || seatDragInfo?.partyName === targetPartyName) return;
    e.preventDefault();
    e.stopPropagation();
    if (hoveredPartyName !== targetPartyName) setHoveredPartyName(targetPartyName);
  };

  const handlePartyRowDrop = (targetPartyName: string, e: React.DragEvent) => {
    const data = parseDragData(e.dataTransfer.getData('application/json'));
    if (
      !data ||
      data.type !== 'party' ||
      !data.partyName ||
      data.sourceTableId !== table.id ||
      data.partyName === targetPartyName
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setHoveredPartyName(null);
    setDragDepth(0);
    const others = table.guests.filter((g) => g.party !== data.partyName);
    const firstIdxOfTarget = others.findIndex((g) => g.party === targetPartyName);
    tryReorderToIndex(data.partyName, firstIdxOfTarget >= 0 ? firstIdxOfTarget : others.length);
  };

  const handlePartyListDragOver = (e: React.DragEvent) => {
    if (draggedFromThisTable) e.preventDefault();
  };

  const handlePartyListDrop = (e: React.DragEvent) => {
    const data = parseDragData(e.dataTransfer.getData('application/json'));
    if (!data || data.type !== 'party' || !data.partyName || data.sourceTableId !== table.id) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setHoveredPartyName(null);
    setDragDepth(0);
    const others = table.guests.filter((g) => g.party !== data.partyName);
    tryReorderToIndex(data.partyName, others.length);
  };

  return {
    handleSeatRowDragOver,
    handleSeatRowDrop,
    handlePartyRowDragOver,
    handlePartyRowDrop,
    handlePartyListDragOver,
    handlePartyListDrop,
  };
};

// -----------------------------------------------------------------------------
// Main card
// -----------------------------------------------------------------------------

interface TableCardProps {
  table: Table;
  onDrop: (e: React.DragEvent, tableId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onRemovePartyFromTable: (partyName: string, tableId: string) => void;
  unassignedGuests?: Guest[];
  allTables?: Table[];
  displayMode?: TableDisplayMode;
}

export const TableCard = ({
  table,
  onDrop,
  onDragOver,
  onRemovePartyFromTable,
  unassignedGuests = EMPTY_GUESTS,
  allTables = EMPTY_TABLES,
  displayMode = 'party',
}: TableCardProps) => {
  const { isDraggingGuest, removeGuestFromTable, reorderPartyInTable, seatDragInfo } = useSeating();
  const [dragDepth, setDragDepth] = useState(0);
  const [hoveredSeatIndex, setHoveredSeatIndex] = useState<number | null>(null);
  const [hoveredPartyName, setHoveredPartyName] = useState<string | null>(null);
  const [pendingReorder, setPendingReorder] = useState<PendingReorder | null>(null);

  const parties = getPartiesFromGuests(table.guests);
  const occupancy = table.guests.length;
  const tableName = table.name || `Table ${table.id.replace('table-', '')}`;

  const draggedFromThisTable = seatDragInfo?.sourceTableId === table.id;

  // Landing-zone preview for By Guest mode (range of seat rows)
  const previewRange = (() => {
    if (
      displayMode !== 'guest' ||
      !draggedFromThisTable ||
      !seatDragInfo ||
      hoveredSeatIndex === null
    ) {
      return null;
    }
    const partyBlock = table.guests.filter((g) => g.party === seatDragInfo.partyName);
    if (partyBlock.length === 0) return null;
    const others = table.guests.filter((g) => g.party !== seatDragInfo.partyName);
    const target = Math.max(0, Math.min(hoveredSeatIndex, others.length));
    return { start: target, end: target + partyBlock.length - 1 };
  })();
  const previewColor = seatDragInfo ? getPartyColor(seatDragInfo.partyName) : null;

  const dragClass =
    dragDepth > 0
      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      : isDraggingGuest
        ? 'ring-2 ring-primary/30'
        : '';

  const tryReorderToIndex = (partyName: string, rawTargetIdx: number) => {
    const others = table.guests.filter((g) => g.party !== partyName);
    const clampedTarget = clamp(rawTargetIdx, 0, others.length);
    const splitParty = findSplitPartyName(others, clampedTarget);
    if (splitParty) {
      setPendingReorder({ partyName, targetIndex: clampedTarget, splitPartyName: splitParty });
      return;
    }
    reorderPartyInTable(table.id, partyName, clampedTarget);
  };

  const handlers = useReorderHandlers({
    table,
    draggedFromThisTable,
    seatDragInfo,
    hoveredSeatIndex,
    hoveredPartyName,
    setHoveredSeatIndex,
    setHoveredPartyName,
    setDragDepth: (v) => setDragDepth(v),
    tryReorderToIndex,
  });

  return (
    <div
      className={`border-border bg-card min-h-[200px] rounded-lg border p-4 shadow-xs transition-all duration-150 hover:shadow-md ${dragClass}`}
      onDrop={(e) => {
        setDragDepth(0);
        onDrop(e, table.id);
      }}
      onDragOver={onDragOver}
      onDragEnter={() => setDragDepth((d) => d + 1)}
      onDragLeave={() => setDragDepth((d) => Math.max(0, d - 1))}
    >
      <TableHeader
        tableName={tableName}
        occupancy={occupancy}
        recommended={table.defaultChairs}
        max={table.maxChairs}
      />
      <div className="text-muted-foreground mb-3 text-xs">
        {table.tableSize} • {table.commonUse}
      </div>

      {displayMode === 'guest' ? (
        <div onDragLeave={() => setHoveredSeatIndex(null)}>
          {table.capacity <= 0 ? (
            <DropPlaceholder text="Drop guests here" />
          ) : (
            <div className="space-y-1">
              {Array.from({ length: table.capacity }, (_, i) => {
                const guest = table.guests[i];
                const isPreview =
                  previewRange !== null && i >= previewRange.start && i <= previewRange.end;
                return (
                  <div
                    key={guest?.id ?? `empty-seat-${i}`}
                    onDragOver={(e) => handlers.handleSeatRowDragOver(i, e)}
                    onDrop={(e) => handlers.handleSeatRowDrop(i, e)}
                  >
                    <SeatRow
                      index={i}
                      guest={guest}
                      tableId={table.id}
                      isPreview={isPreview}
                      previewColor={previewColor}
                      onRemove={guest ? () => removeGuestFromTable(guest.id) : undefined}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <PartyList
          table={table}
          parties={parties}
          unassignedGuests={unassignedGuests}
          allTables={allTables}
          onRemovePartyFromTable={onRemovePartyFromTable}
          hoveredPartyName={hoveredPartyName}
          onPartyDragOver={handlers.handlePartyRowDragOver}
          onPartyDragLeave={() => setHoveredPartyName(null)}
          onPartyDrop={handlers.handlePartyRowDrop}
          onListDragOver={handlers.handlePartyListDragOver}
          onListDrop={handlers.handlePartyListDrop}
        />
      )}

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
