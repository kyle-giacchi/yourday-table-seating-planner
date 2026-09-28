/**
 * Pure seating model — every assignment / reorder transition and every
 * party-identity rule (invariant 8) lives here. Providers apply the result;
 * cards ask it for drop previews. No React.
 */
import type { Guest, Table } from '@/types/seating';
import type { DragData } from '@/types/dragDrop';
import { checkCapacityStatus, type CapacityCheckResult } from '@/lib/capacityChecker';
import { clamp } from '@/lib/utils';
import { partyKey, samePartyName } from './partyUtils';

export interface SeatingModel {
  tables: Table[];
  unassignedGuests: Guest[];
}

const seatedGuests = (model: SeatingModel): Guest[] => model.tables.flatMap((t) => t.guests);

/**
 * Canonical casing already used by any guest in the same party, so stored
 * `guest.party` values stay consistent. Falls back to the incoming string.
 */
export const canonicalPartyName = (incoming: string, model: SeatingModel): string => {
  const key = partyKey(incoming);
  if (!key) return incoming;
  const match = [...model.unassignedGuests, ...seatedGuests(model)].find(
    (g) => partyKey(g.party) === key,
  );
  return match?.party ?? incoming;
};

/**
 * Guests a drag payload carries. A guest drag carries that guest; a party drag
 * carries every member at its source — the source table when `sourceTableId`
 * is set, otherwise the unassigned list.
 */
export const guestsForMove = (model: SeatingModel, data: DragData): Guest[] => {
  if (data.type === 'guest') {
    const guest = [...model.unassignedGuests, ...seatedGuests(model)].find(
      (g) => g.id === data.guestId,
    );
    return guest ? [guest] : [];
  }
  if (!data.partyName) return [];
  const pool = data.sourceTableId
    ? (model.tables.find((t) => t.id === data.sourceTableId)?.guests ?? [])
    : model.unassignedGuests;
  return pool.filter((g) => samePartyName(g.party, data.partyName));
};

/**
 * Move guests (wherever they currently are) to the end of a table, or back to
 * the unassigned list when `toTableId` is null. Unknown ids / tables are no-ops.
 */
export const moveGuests = (
  model: SeatingModel,
  guestIds: string[],
  toTableId: string | null,
): SeatingModel => {
  const ids = new Set(guestIds);
  const source =
    toTableId === null ? seatedGuests(model) : [...model.unassignedGuests, ...seatedGuests(model)];
  const moving = source.filter((g) => ids.has(g.id));
  if (moving.length === 0) return model;
  if (toTableId !== null && !model.tables.some((t) => t.id === toTableId)) return model;

  const without = (guests: Guest[]) => guests.filter((g) => !ids.has(g.id));
  return {
    tables: model.tables.map((t) => {
      const rest = without(t.guests);
      if (t.id === toTableId) return { ...t, guests: [...rest, ...moving] };
      return rest.length === t.guests.length ? t : { ...t, guests: rest };
    }),
    unassignedGuests:
      toTableId === null ? [...model.unassignedGuests, ...moving] : without(model.unassignedGuests),
  };
};

export interface AssignmentPlan {
  table: Table;
  guestIds: string[];
  capacity: CapacityCheckResult;
}

/**
 * What dropping `data` on `tableId` would do. Null means no-op (unknown table,
 * nothing to move, or everyone is already seated there).
 */
export const planAssignment = (
  model: SeatingModel,
  data: DragData,
  tableId: string,
): AssignmentPlan | null => {
  const table = model.tables.find((t) => t.id === tableId);
  if (!table) return null;
  const guestIds = guestsForMove(model, data)
    .filter((g) => !table.guests.some((s) => s.id === g.id))
    .map((g) => g.id);
  if (guestIds.length === 0) return null;
  return { table, guestIds, capacity: checkCapacityStatus(table, guestIds.length) };
};

/** Name of the party whose contiguous run would be split by inserting at `target`. */
export const findSplitPartyName = (others: Guest[], target: number): string | null => {
  if (target <= 0 || target >= others.length) return null;
  const before = others[target - 1].party;
  if (!before) return null;
  return samePartyName(before, others[target].party) ? before : null;
};

export interface PartyBlockPreview {
  /** Clamped insertion index among the other guests. */
  target: number;
  /** Seat range the block will occupy after the move. */
  start: number;
  end: number;
  /** Party that the insertion would split, if any. */
  splitPartyName: string | null;
}

/**
 * Where `partyName`'s block would land if moved to `targetIndex`. Null if the
 * party isn't here or nothing is being hovered.
 */
export const previewPartyBlock = (
  guests: Guest[],
  partyName: string | undefined,
  targetIndex: number | null,
): PartyBlockPreview | null => {
  if (!partyName || targetIndex === null) return null;
  const blockSize = guests.filter((g) => samePartyName(g.party, partyName)).length;
  if (blockSize === 0) return null;
  const others = guests.filter((g) => !samePartyName(g.party, partyName));
  const target = clamp(targetIndex, 0, others.length);
  return {
    target,
    start: target,
    end: target + blockSize - 1,
    splitPartyName: findSplitPartyName(others, target),
  };
};

/** Index (among the other guests) where `targetParty` begins; end of list if absent. */
export const partyInsertIndex = (guests: Guest[], movingParty: string, targetParty: string) => {
  const others = guests.filter((g) => !samePartyName(g.party, movingParty));
  const idx = others.findIndex((g) => samePartyName(g.party, targetParty));
  return idx >= 0 ? idx : others.length;
};

/** Move `partyName`'s members as one block to `targetIndex` among the other guests. */
export const reorderPartyBlock = (
  guests: Guest[],
  partyName: string,
  targetIndex: number,
): Guest[] => {
  const block = guests.filter((g) => samePartyName(g.party, partyName));
  if (block.length === 0) return guests;
  const others = guests.filter((g) => !samePartyName(g.party, partyName));
  const target = clamp(targetIndex, 0, others.length);
  return [...others.slice(0, target), ...block, ...others.slice(target)];
};
