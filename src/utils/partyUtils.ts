import type { Guest, Table } from '@/types/seating';

export interface Party {
  name: string;
  guests: Guest[];
  size: number;
}

export interface EnhancedParty extends Party {
  originalSize: number;
  assignedCount: number;
  unassignedCount: number;
  isPartiallyAssigned: boolean;
}

/**
 * Normalize a party name for case-insensitive comparison / grouping.
 * Display text preserves the user's original casing — only this key is lowercased.
 */
export const partyKey = (partyName: string | undefined | null): string =>
  (partyName ?? '').trim().toLowerCase();

/** Case-insensitive, whitespace-insensitive party-name equality. */
export const samePartyName = (
  a: string | undefined | null,
  b: string | undefined | null,
): boolean => partyKey(a) === partyKey(b);

export const getPartiesFromGuests = (guests: Guest[]): Party[] => {
  // Group by normalized key but keep the first-seen display name so
  // "Smith Family" and "smith family" merge into a single party instead of
  // rendering as two separate groups.
  const partyMap = new Map<string, { displayName: string; guests: Guest[] }>();

  guests.forEach((guest) => {
    const key = partyKey(guest.party);
    const existing = partyMap.get(key);
    if (existing) {
      existing.guests.push(guest);
    } else {
      partyMap.set(key, { displayName: guest.party, guests: [guest] });
    }
  });

  return Array.from(partyMap.values()).map(({ displayName, guests }) => ({
    name: displayName,
    guests,
    size: guests.length,
  }));
};

export const getPartySize = (partyName: string, guests: Guest[]): number => {
  return guests.filter((guest) => samePartyName(guest.party, partyName)).length;
};

export const getGuestsByParty = (partyName: string, guests: Guest[]): Guest[] => {
  return guests.filter((guest) => samePartyName(guest.party, partyName));
};

/**
 * Single source of truth for "how is this party spread across
 * unassigned + tables?". Every other party-status helper derives from this.
 */
export const getPartyAssignmentStatus = (
  partyName: string,
  unassignedGuests: Guest[],
  tables: Table[],
): {
  originalSize: number;
  assignedCount: number;
  unassignedCount: number;
  isPartiallyAssigned: boolean;
} => {
  const matches = (guest: Guest) => samePartyName(guest.party, partyName);
  const unassignedCount = unassignedGuests.filter(matches).length;
  const assignedCount = tables.reduce(
    (count, table) => count + table.guests.filter(matches).length,
    0,
  );
  return {
    originalSize: unassignedCount + assignedCount,
    assignedCount,
    unassignedCount,
    isPartiallyAssigned: assignedCount > 0 && unassignedCount > 0,
  };
};

/** Total (assigned + unassigned) headcount for a named party. */
export const getOriginalPartySize = (
  partyName: string,
  allGuests: Guest[],
  tables: Table[],
): number => getPartyAssignmentStatus(partyName, allGuests, tables).originalSize;

export const getEnhancedPartiesFromGuests = (
  unassignedGuests: Guest[],
  tables: Table[],
): EnhancedParty[] =>
  getPartiesFromGuests(unassignedGuests).map((party) => ({
    ...party,
    ...getPartyAssignmentStatus(party.name, unassignedGuests, tables),
  }));
