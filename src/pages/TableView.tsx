import React, { useState } from 'react';
import { useSeating } from '@/hooks/useSeating';
import { useTableAssignment } from '@/hooks/useTableAssignment';
import type { Party } from '@/utils/partyUtils';
import type { Guest } from '@/types/seating';
import { parseDragData } from '@/types/dragDrop';
import { TableCard } from '@/components/table-view/TableCard';
import { TableVisualCard } from '@/components/table-view/TableVisualCard';
import type { TableDisplayMode } from '@/components/table-view/DisplayModeToggle';
import { DisplayModeToggle } from '@/components/table-view/DisplayModeToggle';
import { UnifiedAssignmentPanel } from '@/components/common/UnifiedAssignmentPanel';
import { CapacityModal } from '@/components/common/CapacityModal';
import { AddTableDropdown } from '@/components/seating/AddTableDropdown';
import { startGuestDrag, startPartyDrag } from '@/utils/dragUtils';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

const TableView = () => {
  const { seatingData, removePartyFromTable } = useSeating();
  const { assignGuestWithCapacityCheck, assignPartyWithCapacityCheck, capacityModal } =
    useTableAssignment();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<TableDisplayMode>('party');

  const handlePartyDragStart = (e: React.DragEvent, party: Party) => {
    startPartyDrag(e, party.name, party.size);
  };

  const handleGuestDragStart = (e: React.DragEvent, guest: Guest) => {
    startGuestDrag(e, guest);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    const jsonString = e.dataTransfer.getData('application/json');
    if (jsonString) {
      const data = parseDragData(jsonString);
      if (!data) return;

      if (data.type === 'party' && data.partyName) {
        await assignPartyWithCapacityCheck(data.partyName, tableId);
      } else if (data.type === 'guest' && data.guestId) {
        await assignGuestWithCapacityCheck(data.guestId, tableId);
      }
    } else {
      // Fallback for old drag format (guest ID as text)
      const guestId = e.dataTransfer.getData('text/plain');
      if (guestId) {
        await assignGuestWithCapacityCheck(guestId, tableId);
      }
    }
  };

  const handleRemovePartyFromTable = (partyName: string, tableId: string) => {
    removePartyFromTable(partyName, tableId);
  };

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        {/* Main Content */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Tables Section */}
          <div className="bg-background flex-1 overflow-y-auto">
            <div className="container mx-auto p-6">
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Seat Assignments</h1>
                </div>
                <AddTableDropdown />
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-foreground text-lg font-semibold">
                    Tables ({seatingData.tables.length})
                  </h2>
                  <DisplayModeToggle mode={displayMode} onModeChange={setDisplayMode} />
                </div>
                {/* Mobile toggle — only visible below md breakpoint */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 md:hidden"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  aria-expanded={isSidebarOpen}
                  aria-controls="assignment-sidebar"
                >
                  <Users className="h-4 w-4" />
                  {isSidebarOpen ? 'Hide Guests' : 'Show Guests'}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {seatingData.tables.map((table) =>
                  displayMode === 'visual' ? (
                    <TableVisualCard
                      key={table.id}
                      table={table}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    />
                  ) : (
                    <TableCard
                      key={table.id}
                      table={table}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onRemovePartyFromTable={handleRemovePartyFromTable}
                      unassignedGuests={seatingData.unassignedGuests}
                      allTables={seatingData.tables}
                      displayMode={displayMode}
                    />
                  ),
                )}
                {seatingData.tables.length === 0 && (
                  <div className="text-muted-foreground col-span-full py-12 text-center">
                    <p>No tables available. Use the Add Table button above to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Unified Assignment Panel (Right sidebar) */}
          {/* On desktop (md+): always visible as a side panel */}
          {/* On mobile: toggled via the button above, shown as an overlay */}
          <div
            id="assignment-sidebar"
            className={`border-border bg-card border-l p-4 md:relative md:block md:w-80 md:translate-x-0 ${
              isSidebarOpen
                ? 'absolute inset-y-0 right-0 z-10 w-80 translate-x-0 shadow-xl transition-transform'
                : 'hidden'
            } `}
          >
            <UnifiedAssignmentPanel
              mode="party"
              onPartyDragStart={handlePartyDragStart}
              onGuestDragStart={handleGuestDragStart}
              showModeToggle={true}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Capacity Modal */}
      {capacityModal.data && (
        <CapacityModal
          isOpen={capacityModal.isOpen}
          onClose={capacityModal.onCancel}
          onConfirm={capacityModal.onConfirm}
          tableName={capacityModal.data.tableName}
          currentCount={capacityModal.data.currentCount}
          newCount={capacityModal.data.newCount}
          defaultCapacity={capacityModal.data.defaultCapacity}
          maxCapacity={capacityModal.data.maxCapacity}
        />
      )}
    </>
  );
};

export default TableView;
