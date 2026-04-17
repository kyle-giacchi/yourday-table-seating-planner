import type { Guest, Table } from '@/types/seating';
import type { BanquetSummaryData } from '@/types/banquet';

type TableTypeSummary = BanquetSummaryData['tableTypeSummary'][number];
type ExtraSeatTable = BanquetSummaryData['extraSeatTables'][number];
type FoodSummaryItem = BanquetSummaryData['foodSummary'][number];
type TableAssignment = BanquetSummaryData['tableAssignments'][number];

const getTableTypeSummary = (tables: Table[]): TableTypeSummary[] => {
  const typeMap = new Map<string, TableTypeSummary>();
  for (const table of tables) {
    const type = `${table.tableSize} ${table.shape}`;
    if (!typeMap.has(type)) {
      typeMap.set(type, { type, count: 0, totalSeats: 0, shape: table.shape });
    }
    const entry = typeMap.get(type)!;
    entry.count += 1;
    entry.totalSeats += table.capacity;
  }
  return Array.from(typeMap.values()).sort((a, b) => b.count - a.count);
};

const getExtraSeatTables = (tables: Table[]): ExtraSeatTable[] =>
  tables
    .filter((table) => table.capacity > table.defaultChairs)
    .map((table) => ({
      tableNumber: table.tableNumber,
      tableName: table.name,
      defaultSeats: table.defaultChairs,
      currentSeats: table.capacity,
      extraSeats: table.capacity - table.defaultChairs,
    }))
    .sort((a, b) => a.tableNumber - b.tableNumber);

const getFoodSummary = (tables: Table[], unassignedGuests: Guest[]): FoodSummaryItem[] => {
  const mealCounts = new Map<string, number>();
  let totalGuests = 0;

  const tally = (guest: Guest) => {
    const meal = guest.mealSelection || 'Unassigned';
    mealCounts.set(meal, (mealCounts.get(meal) || 0) + 1);
    totalGuests += 1;
  };

  for (const table of tables) for (const guest of table.guests) tally(guest);
  for (const guest of unassignedGuests) tally(guest);

  return Array.from(mealCounts.entries())
    .map(([mealType, count]) => ({
      mealType,
      count,
      percentage: totalGuests > 0 ? Math.round((count / totalGuests) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

const getLastName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1].toLowerCase();
};

const getTableAssignments = (tables: Table[]): TableAssignment[] =>
  tables
    .filter((table) => table.guests.length > 0)
    .map((table) => ({
      tableNumber: table.tableNumber,
      tableName: table.name,
      tableSize: table.tableSize,
      shape: table.shape,
      capacity: table.capacity,
      defaultChairs: table.defaultChairs,
      isHeadTable: table.isHeadTable,
      guests: table.guests
        .map((guest) => ({
          name: guest.fullName,
          mealSelection: guest.mealSelection || 'Unassigned',
          allergyFlags: guest.allergyFlags,
          dietaryNotes: guest.dietaryNotes,
        }))
        .sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name))),
    }))
    .sort((a, b) => {
      if (a.isHeadTable && !b.isHeadTable) return -1;
      if (!a.isHeadTable && b.isHeadTable) return 1;
      return a.tableNumber - b.tableNumber;
    });

const getTotalChairsNeeded = (tables: Table[]): number =>
  tables.reduce((total, table) => total + table.capacity, 0);

export const buildBanquetSummary = (
  tables: Table[],
  unassignedGuests: Guest[],
): BanquetSummaryData => {
  const assignedGuests = tables.reduce((sum, table) => sum + table.guests.length, 0);
  return {
    tableTypeSummary: getTableTypeSummary(tables),
    extraSeatTables: getExtraSeatTables(tables),
    foodSummary: getFoodSummary(tables, unassignedGuests),
    tableAssignments: getTableAssignments(tables),
    totalTables: tables.length,
    totalChairs: getTotalChairsNeeded(tables),
    totalGuests: assignedGuests + unassignedGuests.length,
    assignedGuests,
    unassignedGuests: unassignedGuests.length,
  };
};
