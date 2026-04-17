import { useMemo } from 'react';
import type { Guest, Table } from '@/types/seating';
import { partyKey } from '@/utils/partyUtils';

export interface SummaryData {
  totalGuests: number;
  assignedGuests: number;
  unassignedGuests: number;
  mealStats: Record<string, number>;
  partyStats: Record<string, number>;
  totalParties: number;
  assignmentPercentage: number;
}

export const useSummaryData = (guests: Guest[], tables: Table[]): SummaryData => {
  return useMemo(() => {
    const assignedGuests = tables.reduce((sum, table) => sum + table.guests.length, 0);
    const unassignedGuests = guests.length;
    const totalGuests = assignedGuests + unassignedGuests;

    // Meal statistics from all guests (assigned + unassigned)
    const assignedGuestsList = tables.flatMap((table) => table.guests);
    const allGuestsList = [...guests, ...assignedGuestsList];

    const mealStats = allGuestsList.reduce(
      (acc, guest) => {
        acc[guest.mealSelection] = (acc[guest.mealSelection] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Party statistics — aggregate case-insensitively so "Smith Family" and
    // "smith family" count once. Display name uses the first-seen casing.
    const partyStats: Record<string, number> = {};
    const partyKeyToDisplay: Record<string, string> = {};
    for (const guest of allGuestsList) {
      const key = partyKey(guest.party);
      if (!key) continue;
      if (!(key in partyKeyToDisplay)) {
        partyKeyToDisplay[key] = guest.party;
      }
      const display = partyKeyToDisplay[key];
      partyStats[display] = (partyStats[display] || 0) + 1;
    }

    const totalParties = Object.keys(partyStats).length;
    const assignmentPercentage =
      totalGuests > 0 ? Math.round((assignedGuests / totalGuests) * 100) : 0;

    return {
      totalGuests,
      assignedGuests,
      unassignedGuests,
      mealStats,
      partyStats,
      totalParties,
      assignmentPercentage,
    };
  }, [guests, tables]);
};
