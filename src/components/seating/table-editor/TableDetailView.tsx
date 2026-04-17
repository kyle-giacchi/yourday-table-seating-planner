import { useSeating } from '@/hooks/useSeating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Table as TableType } from '@/types/seating';
import {
  TableInfoBlock,
  OccupancyBar,
  PositionsToggle,
  DeleteTableDialog,
  SuggestionLink,
} from './parts/TableDetailBlocks';
import { GuestList } from './parts/GuestList';
import { useGuestDragReorder, useTableActions } from './hooks/useTableDetail';

export const TableDetailView = ({ table, onClose }: { table: TableType; onClose: () => void }) => {
  const { reorderGuestInTable, setHoveredGuestId, guestPositionColorMap } = useSeating();
  const drag = useGuestDragReorder(table.id, reorderGuestInTable);
  const {
    showPositions,
    handleRemoveGuest,
    handleDeleteTable,
    handleClose,
    handleTogglePositions,
  } = useTableActions(table, onClose);

  const tableNumber = String(table.tableNumber || table.id.split('-')[1]?.slice(-2) || '1');
  const currentName = table.name || `Table ${tableNumber}`;
  const currentGuests = table.guests.length;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Table {tableNumber}</CardTitle>
          <Button variant="outline" size="sm" onClick={handleClose} className="h-7 px-3 text-xs">
            Close
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 overflow-y-auto">
        <TableInfoBlock
          name={currentName}
          defaultChairs={table.defaultChairs}
          maxChairs={table.maxChairs}
          tableSize={table.tableSize}
        />

        <OccupancyBar
          currentGuests={currentGuests}
          defaultChairs={table.defaultChairs}
          maxChairs={table.maxChairs}
        />

        {currentGuests > 0 && (
          <PositionsToggle showPositions={showPositions} onToggle={handleTogglePositions} />
        )}

        <GuestList
          guests={table.guests}
          maxChairs={table.maxChairs}
          showPositions={showPositions}
          guestPositionColorMap={guestPositionColorMap}
          dragIndex={drag.dragIndex}
          dropIndex={drag.dropIndex}
          onDragStart={drag.handleDragStart}
          onDragOver={drag.handleDragOver}
          onDrop={drag.handleDrop}
          onDragEnd={drag.handleDragEnd}
          onRemove={handleRemoveGuest}
          onHover={setHoveredGuestId}
        />

        <div className="border-t pt-2">
          <DeleteTableDialog
            tableNumber={tableNumber}
            currentName={currentName}
            currentGuests={currentGuests}
            onDelete={handleDeleteTable}
          />
        </div>

        <SuggestionLink />
      </CardContent>
    </Card>
  );
};
