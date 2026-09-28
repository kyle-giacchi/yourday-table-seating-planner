import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import type { Table, Guest, SeatingData, RoomAsset } from '@/types/seating';
import { useEntityReducer } from '@/hooks/useEntityReducer';
import { useAppData } from '@/contexts/AppDataContext';
import { toast } from '@/hooks/use-toast';
import { SeatingDataContext } from './SeatingDataContext';
import type { EntityDispatchers } from './seating/types';
import { useEntityRefs } from './seating/useEntityRefs';
import { useSeatingOperations } from './seating/useSeatingOperations';
import { useSeatingSyncEffects } from './seating/useSeatingSyncEffects';
import { generateId } from '@/lib/idGenerator';

interface SeatingDataProviderProps {
  children: ReactNode;
}

const newAssetId = () => generateId('asset');

export const SeatingDataProvider = ({ children }: SeatingDataProviderProps) => {
  const {
    initialTables,
    initialGuests,
    initialAssets,
    latestTables,
    latestGuests,
    latestAssets,
    updateSeatingSlice,
    updateAssetsSlice,
    dataVersion,
  } = useAppData();

  const tableReducer = useEntityReducer<Table>(initialTables);
  const guestReducer = useEntityReducer<Guest>(initialGuests);
  const assetReducer = useEntityReducer<RoomAsset>(initialAssets);
  const {
    addEntity: addAssetEntity,
    updateEntity: updateAssetEntity,
    removeEntity: removeAssetEntity,
  } = assetReducer;

  const dispatch: EntityDispatchers = {
    addTableEntity: tableReducer.addEntity,
    updateTableEntity: tableReducer.updateEntity,
    removeTableEntity: tableReducer.removeEntity,
    setTableEntities: tableReducer.setEntities,
    addGuestEntity: guestReducer.addEntity,
    updateGuestEntity: guestReducer.updateEntity,
    removeGuestEntity: guestReducer.removeEntity,
    setGuestEntities: guestReducer.setEntities,
  };

  const refs = useEntityRefs(tableReducer.entities, guestReducer.entities);

  const seatingData: SeatingData = useMemo(
    () => ({
      tables: tableReducer.entities,
      unassignedGuests: guestReducer.entities,
    }),
    [tableReducer.entities, guestReducer.entities],
  );

  const addAsset = useCallback(
    (asset: Omit<RoomAsset, 'id'>) => {
      addAssetEntity({ ...asset, id: newAssetId() });
    },
    [addAssetEntity],
  );

  const updateAsset = useCallback(
    (id: string, updates: Partial<RoomAsset>) => {
      updateAssetEntity(id, updates);
    },
    [updateAssetEntity],
  );

  const removeAsset = useCallback(
    (id: string) => {
      removeAssetEntity(id);
    },
    [removeAssetEntity],
  );

  useSeatingSyncEffects({
    seatingData,
    dataVersion,
    latestTables,
    latestGuests,
    updateSeatingSlice,
    setTableEntities: dispatch.setTableEntities,
    setGuestEntities: dispatch.setGuestEntities,
    assets: assetReducer.entities,
    latestAssets,
    updateAssetsSlice,
    setAssetEntities: assetReducer.setEntities,
  });

  const ops = useSeatingOperations(refs, dispatch);

  // Deleting a table used to orphan seated guests silently. Now we move them
  // back to the unassigned list first so nobody disappears from the roster.
  const removeTable = useCallback(
    (id: string) => {
      const table = tableReducer.entities.find((t) => t.id === id);
      if (!table) {
        dispatch.removeTableEntity(id);
        return;
      }
      const seated = table.guests;
      seated.forEach((g) => dispatch.addGuestEntity(g));
      dispatch.removeTableEntity(id);
      if (seated.length > 0) {
        toast({
          title: 'Table deleted',
          description: `${seated.length} guest${seated.length === 1 ? ' was' : 's were'} moved to Unassigned.`,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispatch is stable
    [tableReducer.entities],
  );

  // Guard updateTable so capacity (defaultChairs / maxChairs) can't be set below
  // the current occupant count. Without this, SeatDots rendering math breaks and
  // a table ends up showing fewer seats than guests.
  const updateTable = useCallback(
    (id: string, updates: Partial<Table> | ((table: Table) => Partial<Table>)) => {
      const current = tableReducer.entities.find((t) => t.id === id);
      const patch: Partial<Table> =
        typeof updates === 'function' ? (current ? updates(current) : {}) : updates;
      if (current) {
        const occupants = current.guests.length;
        if (typeof patch.maxChairs === 'number' && patch.maxChairs < occupants) {
          toast({
            title: "Can't reduce capacity",
            description: `This table has ${occupants} guest${occupants === 1 ? '' : 's'}. Unassign some before setting max below ${occupants}.`,
            variant: 'destructive',
          });
          return;
        }
        if (typeof patch.defaultChairs === 'number' && patch.defaultChairs < occupants) {
          toast({
            title: "Can't reduce default capacity",
            description: `This table has ${occupants} guest${occupants === 1 ? '' : 's'}. Unassign some before setting default below ${occupants}.`,
            variant: 'destructive',
          });
          return;
        }
      }
      // Dispatcher expects full `Table` from the functional form; merge patch
      // onto the current table to preserve required fields.
      if (typeof updates === 'function') {
        dispatch.updateTableEntity(id, (t) => ({ ...t, ...patch }));
      } else {
        dispatch.updateTableEntity(id, patch);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispatch is stable
    [tableReducer.entities],
  );

  const contextValue = useMemo(
    () => ({
      seatingData,
      addTable: ops.addTable,
      addTables: ops.addTables,
      updateTable,
      removeTable,
      addGuest: ops.addGuest,
      updateGuest: ops.updateGuest,
      removeGuest: ops.removeGuest,
      moveGuests: ops.moveGuests,
      removeGuestFromTable: ops.removeGuestFromTable,
      removePartyFromTable: ops.removePartyFromTable,
      reorderGuestInTable: ops.reorderGuestInTable,
      reorderPartyInTable: ops.reorderPartyInTable,
      loadDemoData: ops.loadDemoData,
      assets: assetReducer.entities,
      addAsset,
      updateAsset,
      removeAsset,
    }),
    [
      seatingData,
      ops,
      updateTable,
      removeTable,
      assetReducer.entities,
      addAsset,
      updateAsset,
      removeAsset,
    ],
  );

  return <SeatingDataContext.Provider value={contextValue}>{children}</SeatingDataContext.Provider>;
};
