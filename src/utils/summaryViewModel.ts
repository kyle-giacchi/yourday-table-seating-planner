import type { Guest, Table } from '@/types/seating';
import type { BanquetSummaryData } from '@/types/banquet';
import { buildBanquetSummary } from '@/utils/banquetSummaryUtils';
import { partyKey } from '@/utils/partyUtils';

export interface PartyMealCount {
  mealType: string;
  count: number;
}

export interface PartyGroup {
  name: string;
  guestCount: number;
  tableNames: string[];
  meals: PartyMealCount[];
  unassignedCount: number;
}

export interface SummaryAlert {
  id: string;
  severity: 'error' | 'warning';
  title: string;
  detail: string;
}

export interface SummaryViewModel {
  summary: BanquetSummaryData;
  parties: PartyGroup[];
  averagePartySize: number;
  splitPartyCount: number;
  utilization: {
    assignedSeats: number;
    totalCapacity: number;
    fillPercentage: number;
    emptySeats: number;
  };
  mealCompletionPercentage: number;
  tablesInUse: number;
  emptyTables: number;
  overCapacityTables: Array<{ tableName: string; guests: number; capacity: number }>;
  alerts: SummaryAlert[];
}

const PARTY_NONE = 'Unaffiliated';

const cleanPartyName = (raw: string | undefined): string => {
  const trimmed = (raw ?? '').trim();
  return trimmed.length > 0 ? trimmed : PARTY_NONE;
};

const buildPartyGroups = (tables: Table[], unassigned: Guest[]): PartyGroup[] => {
  type Working = {
    name: string;
    guestCount: number;
    tableNames: Set<string>;
    meals: Map<string, number>;
    unassignedCount: number;
  };

  const groups = new Map<string, Working>();

  // Key by normalized party name so "Smith Family" and "smith family" merge
  // into one row; first-seen display name is kept for the UI.
  const ensure = (name: string): Working => {
    const key = name === PARTY_NONE ? PARTY_NONE : partyKey(name);
    let existing = groups.get(key);
    if (!existing) {
      existing = {
        name,
        guestCount: 0,
        tableNames: new Set(),
        meals: new Map(),
        unassignedCount: 0,
      };
      groups.set(key, existing);
    }
    return existing;
  };

  const tally = (group: Working, guest: Guest) => {
    group.guestCount += 1;
    const meal = guest.mealSelection || 'Unassigned';
    group.meals.set(meal, (group.meals.get(meal) ?? 0) + 1);
  };

  for (const table of tables) {
    for (const guest of table.guests) {
      const group = ensure(cleanPartyName(guest.party));
      tally(group, guest);
      group.tableNames.add(table.name);
    }
  }

  for (const guest of unassigned) {
    const group = ensure(cleanPartyName(guest.party));
    tally(group, guest);
    group.unassignedCount += 1;
  }

  return Array.from(groups.values())
    .map((group) => ({
      name: group.name,
      guestCount: group.guestCount,
      tableNames: Array.from(group.tableNames).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
      meals: Array.from(group.meals.entries())
        .map(([mealType, count]) => ({ mealType, count }))
        .sort((a, b) => b.count - a.count),
      unassignedCount: group.unassignedCount,
    }))
    .sort((a, b) => {
      if (a.name === PARTY_NONE) return 1;
      if (b.name === PARTY_NONE) return -1;
      return b.guestCount - a.guestCount;
    });
};

const buildAlerts = (
  summary: BanquetSummaryData,
  overCapacity: SummaryViewModel['overCapacityTables'],
  allergyGuestCount: number,
): SummaryAlert[] => {
  const alerts: SummaryAlert[] = [];

  if (allergyGuestCount > 0) {
    alerts.push({
      id: 'allergies',
      severity: 'error',
      title: `${allergyGuestCount} guest${allergyGuestCount === 1 ? '' : 's'} with allergies or dietary flags`,
      detail: 'Check guest cards for the ALLERGY badge before service.',
    });
  }

  if (summary.unassignedGuests > 0) {
    alerts.push({
      id: 'unassigned-guests',
      severity: 'warning',
      title: `${summary.unassignedGuests} guest${summary.unassignedGuests === 1 ? '' : 's'} not seated`,
      detail: 'Drag guests onto a table on the Layout page to assign them.',
    });
  }

  const missing = summary.foodSummary.find((f) => f.mealType === 'Unassigned');
  if (missing && missing.count > 0) {
    alerts.push({
      id: 'missing-meals',
      severity: 'error',
      title: `${missing.count} guest${missing.count === 1 ? '' : 's'} missing meal selection`,
      detail: `${missing.percentage}% of guests have not chosen a meal.`,
    });
  }

  if (summary.extraSeatTables.length > 0) {
    const extraTotal = summary.extraSeatTables.reduce((sum, t) => sum + t.extraSeats, 0);
    alerts.push({
      id: 'extra-seats',
      severity: 'warning',
      title: `${summary.extraSeatTables.length} table${summary.extraSeatTables.length === 1 ? '' : 's'} need ${extraTotal} extra chair${extraTotal === 1 ? '' : 's'}`,
      detail: 'These tables exceed their default seating configuration.',
    });
  }

  if (overCapacity.length > 0) {
    alerts.push({
      id: 'over-capacity',
      severity: 'error',
      title: `${overCapacity.length} table${overCapacity.length === 1 ? '' : 's'} over capacity`,
      detail: 'More guests assigned than chairs available.',
    });
  }

  return alerts;
};

export const buildSummaryViewModel = (
  tables: Table[],
  unassignedGuests: Guest[],
): SummaryViewModel => {
  const summary = buildBanquetSummary(tables, unassignedGuests);

  const parties = buildPartyGroups(tables, unassignedGuests);
  const averagePartySize =
    parties.length > 0 ? Math.round((summary.totalGuests / parties.length) * 10) / 10 : 0;
  const splitPartyCount = parties.filter((p) => p.tableNames.length >= 2).length;

  const totalCapacity = summary.totalChairs;
  const assignedSeats = summary.assignedGuests;
  const emptySeats = Math.max(0, totalCapacity - assignedSeats);
  const fillPercentage = totalCapacity > 0 ? Math.round((assignedSeats / totalCapacity) * 100) : 0;

  const missingMealCount = summary.foodSummary.find((f) => f.mealType === 'Unassigned')?.count ?? 0;
  const mealCompletionPercentage =
    summary.totalGuests > 0
      ? Math.round(((summary.totalGuests - missingMealCount) / summary.totalGuests) * 100)
      : 0;

  const tablesInUse = summary.tableAssignments.length;
  const emptyTables = Math.max(0, summary.totalTables - tablesInUse);

  const overCapacityTables = tables
    .filter((t) => t.guests.length > t.capacity)
    .map((t) => ({ tableName: t.name, guests: t.guests.length, capacity: t.capacity }));

  const countAllergyGuests = (): number => {
    let count = 0;
    for (const table of tables) {
      for (const guest of table.guests) {
        if (guest.allergyFlags && guest.allergyFlags.length > 0) count += 1;
      }
    }
    for (const guest of unassignedGuests) {
      if (guest.allergyFlags && guest.allergyFlags.length > 0) count += 1;
    }
    return count;
  };
  const allergyGuestCount = countAllergyGuests();

  const alerts = buildAlerts(summary, overCapacityTables, allergyGuestCount);

  return {
    summary,
    parties,
    averagePartySize,
    splitPartyCount,
    utilization: { assignedSeats, totalCapacity, fillPercentage, emptySeats },
    mealCompletionPercentage,
    tablesInUse,
    emptyTables,
    overCapacityTables,
    alerts,
  };
};
