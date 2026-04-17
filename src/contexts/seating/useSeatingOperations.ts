import { useCallback } from 'react';
import type { Table, Guest } from '@/types/seating';
import { getNextTableNumber } from '@/utils/tableNumberUtils';
import { DEMO_TABLES, DEMO_UNASSIGNED_GUESTS } from '@/services/DataRepository';
import { partyKey } from '@/utils/partyUtils';
import { clamp } from '@/lib/utils';
import { generateId } from '@/lib/idGenerator';
import type { EntityRefs, EntityDispatchers } from './types';

/**
 * Return the canonical casing used by any existing guest in the same party
 * (case-insensitively). Falls back to the incoming string unchanged. Keeps
 * `guest.party` consistent so strict-equality filters across the app stay
 * correct without needing case-insensitive compares everywhere.
 */
const resolvePartyCasing = (incoming: string, guests: Guest[], tables: Table[]): string => {
  const key = partyKey(incoming);
  if (!key) return incoming;
  const match =
    guests.find((g) => partyKey(g.party) === key) ??
    tables.flatMap((t) => t.guests).find((g) => partyKey(g.party) === key);
  return match?.party ?? incoming;
};

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
      const canonicalParty = resolvePartyCasing(base.party, guestsRef.current, tablesRef.current);
      addGuestEntity({ ...base, party: canonicalParty });
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
    (id: string, updates: Partial<Guest>) => {
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
  const { addGuestEntity, removeGuestEntity, updateTableEntity } = dispatch;

  const assignGuestToTable = useCallback(
    (guestId: string, tableId: string) => {
      const guest = guestsRef.current.find((g) => g.id === guestId);
      if (!guest) return;
      removeGuestEntity(guestId);
      updateTableEntity(tableId, (table: Table) => ({
        ...table,
        guests: [...table.guests, guest],
      }));
    },
    [removeGuestEntity, updateTableEntity, guestsRef],
  );

  const removeGuestFromTable = useCallback(
    (guestId: string) => {
      const table = tablesRef.current.find((t) => t.guests.some((g) => g.id === guestId));
      if (!table) return;
      const guest = table.guests.find((g) => g.id === guestId);
      if (!guest) return;
      updateTableEntity(table.id, {
        guests: table.guests.filter((g) => g.id !== guestId),
      } as Partial<Table>);
      addGuestEntity(guest);
    },
    [updateTableEntity, addGuestEntity, tablesRef],
  );

  const assignPartyToTable = useCallback(
    (partyName: string, tableId: string) => {
      const partyGuests = guestsRef.current.filter((g) => g.party === partyName);
      if (partyGuests.length === 0) return;
      const table = tablesRef.current.find((t) => t.id === tableId);
      if (!table) return;
      partyGuests.forEach((g) => removeGuestEntity(g.id));
      updateTableEntity(tableId, {
        guests: [...table.guests, ...partyGuests],
      } as Partial<Table>);
    },
    [removeGuestEntity, updateTableEntity, tablesRef, guestsRef],
  );

  const removePartyFromTable = useCallback(
    (partyName: string, tableId: string) => {
      const table = tablesRef.current.find((t) => t.id === tableId);
      if (!table) return;
      const partyGuests = table.guests.filter((g) => g.party === partyName);
      if (partyGuests.length === 0) return;
      updateTableEntity(tableId, {
        guests: table.guests.filter((g) => g.party !== partyName),
      } as Partial<Table>);
      partyGuests.forEach((g) => addGuestEntity(g));
    },
    [updateTableEntity, addGuestEntity, tablesRef],
  );

  const reorderPartyInTable = useCallback(
    (tableId: string, partyName: string, targetIndex: number) => {
      const table = tablesRef.current.find((t) => t.id === tableId);
      if (!table) return;
      const partyBlock = table.guests.filter((g) => g.party === partyName);
      if (partyBlock.length === 0) return;
      const others = table.guests.filter((g) => g.party !== partyName);
      const target = clamp(targetIndex, 0, others.length);
      const newGuests = [...others.slice(0, target), ...partyBlock, ...others.slice(target)];
      updateTableEntity(tableId, { guests: newGuests } as Partial<Table>);
    },
    [updateTableEntity, tablesRef],
  );

  return {
    assignGuestToTable,
    removeGuestFromTable,
    assignPartyToTable,
    removePartyFromTable,
    reorderPartyInTable,
  };
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
