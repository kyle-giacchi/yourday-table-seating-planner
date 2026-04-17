import type { Table } from '@/types/seating';

/**
 * Find the next available table number by looking for the first gap in the
 * sequence of existing table numbers.
 */
export const getNextTableNumber = (existingTables: Pick<Table, 'tableNumber'>[]): number => {
  if (!existingTables || existingTables.length === 0) return 1;

  const existingNumbers = existingTables
    .map((table) => table.tableNumber)
    .filter((num) => typeof num === 'number')
    .sort((a, b) => a - b);

  // Find first gap in the sequence
  for (let i = 1; i <= existingNumbers.length + 1; i++) {
    if (!existingNumbers.includes(i)) {
      return i;
    }
  }

  return existingNumbers.length + 1;
};
