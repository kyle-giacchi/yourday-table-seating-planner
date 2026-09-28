import { useCallback } from 'react';
import type { Table, Guest } from '@/types/seating';
import { getNextTableNumber } from '@/utils/tableNumberUtils';
import { DEMO_TABLES, DEMO_UNASSIGNED_GUESTS } from '@/services/DataRepository';
import {
  canonicalPartyName,
  moveGuests as moveGuestsInModel,
  reorderPartyBlock,
  type SeatingModel,
} from '@/utils/seatingModel';
import { samePartyName } from '@/utils/partyUtils';
import { generateId } from '@/lib/idGenerator';
import type { EntityRefs, EntityDispatchers } from './types';

const buildNewTable = (
  input: Omit<Table, 'id' | 'name' | 'tableNumber'>,
  tables: Table[],
): Table => {
  const tableNumber = getNextTableNumber(tables);
  return {
    ...input,
    id: generateId('table'),
    name: `Table ${tableNumber}`,
    tableNumber,
    tableSize: input.tableSize || '60" diameter',
    commonUse: input.commonUse || 'General use',
    defaultChairs: input.defaultChairs || input.capacity,
    maxChairs: input.maxChairs || input.capacity + 2,
  };
};

const newGuestId = () => generateId('guest');

const useTableMutations = (refs: EntityRefs, dispatch: EntityDispatchers) => {
  const { tablesRef } = refs;
  const { addTableEntity, setTableEntities } = dispatch;

  const addTable = useCallback(
    (table: Omit<Table, 'id' | 'name' | 'tableNumber'>) => {
      addTableEntity(buildNewTable(table, tablesRef.current));
    },
    [addTableEntity, tablesRef],
  );

  const addTables = useCallback(
    (tables: Omit<Table, 'id' | 'name' | 'tableNumber'>[]) => {
      if (tables.length === 0) return;
      const accumulated: Table[] = [...tablesRef.current];
      for (const t of tables) {
        accumulated.push(buildNewTable(t, accumulated));
      }
      setTableEntities(accumulated);
    },
    [setTableEntities, tablesRef],
  );

  return { addTable, addTables };
};

const useGuestMutations = (refs: EntityRefs, dispatch: EntityDispatchers) => {
  const { tablesRef, guestsRef } = refs;
  const { addGuestEntity, updateGuestEntity, removeGuestEntity, updateTableEntity } = dispatch;

  const addGuest = useCallback(
    (guest: Omit<Guest, 'id'> | Guest) => {
      const base: Guest = 'id' in guest ? (guest as Guest) : { ...guest, id: newGuestId() };
      const party = canonicalPartyName(base.party, {
        tables: tablesRef.current,
        unassignedGuests: guestsRef.current,
      });
      addGuestEntity({ ...base, party });
    },
    [addGuestEntity, guestsRef, tablesRef],
  );

  const removeGuest = useCallback(
    (guestId: string) => {
      if (guestsRef.current.some((g) => g.id === guestId)) {
        removeGuestEntity(guestId);
        return;
      }
      const table = tablesRef.current.find((t) => t.guests.some((g) => g.id === guestId));
      if (!table) return;
      updateTableEntity(table.id, {
        guests: table.guests.filter((g) => g.id !== guestId),
      } as Partial<Table>);
    },
    [removeGuestEntity, updateTableEntity, tablesRef, guestsRef],
  );

  const updateGuest = useCallback(
    (id: string, patch: Partial<Guest>) => {
      // Keep party casing canonical on rename too, not just on add (invariant 8).
      const updates =
        patch.party === undefined
          ? patch
          : {
              ...patch,
              party: canonicalPartyName(patch.party, {
                tables: tablesRef.current,
                unassignedGuests: guestsRef.current.filter((g) => g.id !== id),
              }),
            };
      if (guestsRef.current.some((g) => g.id === id)) {
        updateGuestEntity(id, updates);
        return;
      }
      const table = tablesRef.current.find((t) => t.guests.some((g) => g.id === id));
      if (!table) return;
      updateTableEntity(table.id, {
        guests: table.guests.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      } as Partial<Table>);
    },
    [updateGuestEntity, updateTableEntity, tablesRef, guestsRef],
  );

  const reorderGuestInTable = useCallback(
    (tableId: string, guestId: string, newIndex: number) => {
      const table = tablesRef.current.find((t) => t.id === tableId);
      if (!table) return;
      const currentIndex = table.guests.findIndex((g) => g.id === guestId);
      if (currentIndex === -1 || currentIndex === newIndex) return;
      const reordered = [...table.guests];
      const [guest] = reordered.splice(currentIndex, 1);
      reordered.splice(newIndex, 0, guest);
      updateTableEntity(tableId, { guests: reordered } as Partial<Table>);
    },
    [updateTableEntity, tablesRef],
  );

  return { addGuest, removeGuest, updateGuest, reorderGuestInTable };
};

const useAssignmentMutations = (refs: EntityRefs, dispatch: EntityDispatchers) => {
  const { tablesRef, guestsRef } = refs;
  const { setTableEntities, setGuestEntities, updateTableEntity } = dispatch;

  // Every assignment change goes through the pure model; this just applies it.
  const moveGuests = useCallback(
    (guestIds: string[], toTableId: string | null) => {
      const model: SeatingModel = {
        tables: tablesRef.current,
        unassignedGuests: guestsRef.current,
      };
      const next = moveGuestsInModel(model, guestIds, toTableId);
      if (next === model) return;
      setTableEntities(next.tables);
      setGuestEntities(next.unassignedGuests);
    },
    [setTableEntities, setGuestEntities, tablesRef, guestsRef],
  );

  const removeGuestFromTable = useCallback(
    (guestId: string) => moveGuests([guestId], null),
    [moveGuests],
  );

  const removePartyFromTable = useCallback(
    (partyName: string, tableId: string) => {
      const table = tablesRef.current.find((t) => t.id === tableId);
      if (!table) return;
      const ids = table.guests.filter((g) => samePartyName(g.party, partyName)).map((g) => g.id);
      moveGuests(ids, null);
    },
    [moveGuests, tablesRef],
  );

  const reorderPartyInTable = useCallback(
    (tableId: string, partyName: string, targetIndex: number) => {
      const table = tablesRef.current.find((t) => t.id === tableId);
      if (!table) return;
      updateTableEntity(tableId, {
        guests: reorderPartyBlock(table.guests, partyName, targetIndex),
      } as Partial<Table>);
    },
    [updateTableEntity, tablesRef],
  );

  return { moveGuests, removeGuestFromTable, removePartyFromTable, reorderPartyInTable };
};

const useDemoDataLoader = (dispatch: EntityDispatchers) => {
  const { setTableEntities, setGuestEntities } = dispatch;
  return useCallback(() => {
    setTableEntities(DEMO_TABLES.map((t) => ({ ...t, guests: t.guests.map((g) => ({ ...g })) })));
    setGuestEntities(DEMO_UNASSIGNED_GUESTS.map((g) => ({ ...g })));
  }, [setTableEntities, setGuestEntities]);
};

export const useSeatingOperations = (refs: EntityRefs, dispatch: EntityDispatchers) => {
  const tableMutations = useTableMutations(refs, dispatch);
  const guestMutations = useGuestMutations(refs, dispatch);
  const assignmentMutations = useAssignmentMutations(refs, dispatch);
  const loadDemoData = useDemoDataLoader(dispatch);
  return { ...tableMutations, ...guestMutations, ...assignmentMutations, loadDemoData };
};
