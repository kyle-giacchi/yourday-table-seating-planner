import React, { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSeating } from '@/hooks/useSeating';
import type { Party } from '@/utils/partyUtils';
import { getEnhancedPartiesFromGuests } from '@/utils/partyUtils';
import type { Guest } from '@/types/seating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, User, Undo2 } from 'lucide-react';
import { AssignmentModeToggle } from './AssignmentModeToggle';
import { AssignmentSearch } from './AssignmentSearch';
import { GuestCard } from './GuestCard';
import { PartyCard } from '../table-view/PartyCard';
import { startGuestDrag, startPartyDrag } from '@/utils/dragUtils';
import { parseDragData } from '@/types/dragDrop';

const VIRTUAL_THRESHOLD = 50;

interface UnifiedAssignmentPanelProps {
  mode?: 'party' | 'guest';
  onGuestDragStart?: (e: React.DragEvent, guest: Guest) => void;
  onPartyDragStart?: (e: React.DragEvent, party: Party) => void;
  showModeToggle?: boolean;
  className?: string;
}

export const UnifiedAssignmentPanel = ({
  mode: initialMode = 'guest',
  onGuestDragStart,
  onPartyDragStart,
  showModeToggle = true,
  className = '',
}: UnifiedAssignmentPanelProps) => {
  const {
    seatingData,
    removeGuestFromTable,
    removePartyFromTable,
    isDraggingGuest,
    isDraggingSeated,
  } = useSeating();
  const [assignmentMode, setAssignmentMode] = useState<'party' | 'guest'>(initialMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropDepth, setDropDepth] = useState(0);
  const isDropHovered = dropDepth > 0 && isDraggingGuest;
  const showUnassignOverlay = isDraggingSeated;

  const guestScrollRef = useRef<HTMLDivElement>(null);
  const partyScrollRef = useRef<HTMLDivElement>(null);

  // Get enhanced parties from unassigned guests with assignment status
  const enhancedParties = useMemo(() => {
    return getEnhancedPartiesFromGuests(seatingData.unassignedGuests, seatingData.tables);
  }, [seatingData.unassignedGuests, seatingData.tables]);

  // Filter data based on search term
  const filteredGuests = useMemo(() => {
    if (!searchTerm) return seatingData.unassignedGuests;

    const lowerSearch = searchTerm.toLowerCase();
    return seatingData.unassignedGuests.filter(
      (guest) =>
        guest.fullName.toLowerCase().includes(lowerSearch) ||
        guest.party.toLowerCase().includes(lowerSearch) ||
        guest.mealSelection.toLowerCase().includes(lowerSearch),
    );
  }, [seatingData.unassignedGuests, searchTerm]);

  const filteredParties = useMemo(() => {
    if (!searchTerm) return enhancedParties;

    const lowerSearch = searchTerm.toLowerCase();
    return enhancedParties.filter(
      (party) =>
        party.name.toLowerCase().includes(lowerSearch) ||
        party.size.toString().includes(searchTerm) ||
        party.originalSize.toString().includes(searchTerm),
    );
  }, [enhancedParties, searchTerm]);

  const useGuestVirtualizer = filteredGuests.length > VIRTUAL_THRESHOLD;
  const usePartyVirtualizer = filteredParties.length > VIRTUAL_THRESHOLD;

  // Guest virtualizer — active only when list exceeds threshold.
  // eslint-disable-next-line react-hooks/incompatible-library -- @tanstack/react-virtual returns functions react-compiler can't safely memoize; accepted library boundary
  const guestVirtualizer = useVirtualizer({
    count: useGuestVirtualizer ? filteredGuests.length : 0,
    getScrollElement: () => guestScrollRef.current,
    estimateSize: () => 72, // ~60px card + 12px padding
    overscan: 5,
  });

  // Party virtualizer — active only when list exceeds threshold
  const partyVirtualizer = useVirtualizer({
    count: usePartyVirtualizer ? filteredParties.length : 0,
    getScrollElement: () => partyScrollRef.current,
    estimateSize: () => 56, // ~44px card + 12px padding
    overscan: 5,
  });

  // Default drag handlers — delegate to shared utilities or prop overrides
  const handleGuestDragStart = (e: React.DragEvent, guest: Guest) => {
    if (onGuestDragStart) {
      onGuestDragStart(e, guest);
    } else {
      startGuestDrag(e, guest);
    }
  };

  const handlePartyDragStart = (e: React.DragEvent, party: Party) => {
    if (onPartyDragStart) {
      onPartyDragStart(e, party);
    } else {
      startPartyDrag(e, party.name, party.size);
    }
  };

  const handleUnassignDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropDepth(0);
    const jsonString = e.dataTransfer.getData('application/json');
    if (!jsonString) return;
    const data = parseDragData(jsonString);
    if (!data) return;

    if (data.type === 'guest' && data.guestId) {
      const onTable = seatingData.tables.some((t) => t.guests.some((g) => g.id === data.guestId));
      if (onTable) removeGuestFromTable(data.guestId);
    } else if (data.type === 'party' && data.partyName) {
      const tableWithParty = seatingData.tables.find((t) =>
        t.guests.some((g) => g.party === data.partyName),
      );
      if (tableWithParty) removePartyFromTable(data.partyName, tableWithParty.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const currentCount = assignmentMode === 'guest' ? filteredGuests.length : filteredParties.length;
  const totalCount =
    assignmentMode === 'guest' ? seatingData.unassignedGuests.length : enhancedParties.length;

  return (
    <Card
      className={`card-elevated relative flex min-h-0 flex-1 flex-col transition-all duration-150 ${
        isDropHovered
          ? 'ring-primary ring-2 ring-offset-2'
          : isDraggingGuest
            ? 'ring-primary/30 ring-2'
            : ''
      } ${className}`}
      role="region"
      aria-label="Guest assignment panel"
      onDragOver={handleDragOver}
      onDrop={handleUnassignDrop}
      onDragEnter={() => setDropDepth((d) => d + 1)}
      onDragLeave={() => setDropDepth((d) => Math.max(0, d - 1))}
    >
      {showUnassignOverlay && (
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg transition-all duration-150 ${
            isDropHovered ? 'bg-primary/20 backdrop-blur-[2px]' : 'bg-primary/10'
          }`}
          aria-hidden="true"
        >
          <div
            className={`border-primary bg-card flex items-center gap-2 rounded-full border-2 px-4 py-2 shadow-md transition-transform duration-150 ${
              isDropHovered ? 'scale-110' : 'scale-100'
            }`}
          >
            <Undo2 className="text-primary h-4 w-4" aria-hidden="true" />
            <span className="text-primary text-sm font-semibold">Drop here to unassign</span>
          </div>
        </div>
      )}
      <CardHeader className="compact-spacing shrink-0 pb-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-card-title text-base">Assign By</CardTitle>
            {showModeToggle && (
              <AssignmentModeToggle mode={assignmentMode} onModeChange={setAssignmentMode} />
            )}
          </div>
        </div>

        <AssignmentSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder={`Search ${assignmentMode === 'guest' ? 'guests' : 'parties'}... (${searchTerm ? `${currentCount} of ${totalCount}` : `${totalCount}`})`}
        />
      </CardHeader>

      <CardContent className="compact-spacing flex min-h-0 flex-1 flex-col pt-0">
        {assignmentMode === 'guest' ? (
          <div
            ref={guestScrollRef}
            className="min-h-0 flex-1 overflow-y-auto"
            role="list"
            aria-label={`Unassigned guests, ${filteredGuests.length} items`}
          >
            {filteredGuests.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                {searchTerm ? (
                  <p className="text-sm">No guests found matching "{searchTerm}"</p>
                ) : (
                  <>
                    <User className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
                    <p className="text-sm">All {totalCount} guests have been assigned to tables</p>
                  </>
                )}
              </div>
            ) : useGuestVirtualizer ? (
              <div style={{ height: `${guestVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {guestVirtualizer.getVirtualItems().map((virtualItem) => {
                  const guest = filteredGuests[virtualItem.index];
                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                        paddingBottom: '12px',
                      }}
                    >
                      <GuestCard guest={guest} onDragStart={handleGuestDragStart} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGuests.map((guest) => (
                  <GuestCard key={guest.id} guest={guest} onDragStart={handleGuestDragStart} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            ref={partyScrollRef}
            className="min-h-0 flex-1 overflow-y-auto"
            role="list"
            aria-label={`Unassigned parties, ${filteredParties.length} items`}
          >
            {filteredParties.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                {searchTerm ? (
                  <p className="text-sm">No parties found matching "{searchTerm}"</p>
                ) : (
                  <>
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
                    <p className="text-sm">All {totalCount} parties have been assigned to tables</p>
                  </>
                )}
              </div>
            ) : usePartyVirtualizer ? (
              <div style={{ height: `${partyVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {partyVirtualizer.getVirtualItems().map((virtualItem) => {
                  const party = filteredParties[virtualItem.index];
                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                        paddingBottom: '12px',
                      }}
                    >
                      <PartyCard party={party} onDragStart={handlePartyDragStart} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredParties.map((party) => (
                  <PartyCard key={party.name} party={party} onDragStart={handlePartyDragStart} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
