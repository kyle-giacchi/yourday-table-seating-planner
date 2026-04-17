import Papa from 'papaparse';
import type { Guest, Table } from '@/types/seating';

/**
 * Defends against CSV formula injection (a.k.a. "CSV injection" or "Excel injection").
 * If a cell value begins with one of the characters that Excel / Calc treat as a
 * formula prefix (=, +, -, @, TAB, CR), a single-quote is prepended so the cell is
 * interpreted as plain text when the file is opened in a spreadsheet application.
 */
export const sanitizeCSVCell = (value: string): string => {
  if (typeof value !== 'string') return String(value ?? '');
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
};

export interface ExportGuestData {
  firstName: string;
  lastName: string;
  partyName: string;
  mealSelection: string;
  table: string;
}

export const generateGuestExportData = (guests: Guest[], tables: Table[]): ExportGuestData[] => {
  type GuestWithTable = Guest & { assignedTableName?: string };

  const allGuests: GuestWithTable[] = [
    ...guests, // unassigned guests
    ...tables.flatMap((table) =>
      table.guests.map((guest) => ({ ...guest, assignedTableName: table.name })),
    ),
  ];

  return allGuests.map((guest) => {
    const nameParts = guest.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      firstName,
      lastName,
      partyName: guest.party,
      mealSelection: guest.mealSelection || 'No Meal Selected',
      table: guest.assignedTableName || 'Unassigned',
    };
  });
};

export const exportGuestsToCSV = (guests: Guest[], tables: Table[]): void => {
  const exportData = generateGuestExportData(guests, tables);

  // Convert to array format for CSV, sanitizing each cell against formula injection
  const csvData = exportData.map((guest) => [
    sanitizeCSVCell(guest.firstName),
    sanitizeCSVCell(guest.lastName),
    sanitizeCSVCell(guest.partyName),
    sanitizeCSVCell(guest.mealSelection),
    sanitizeCSVCell(guest.table),
  ]);

  // Add header row (headers are static strings, no injection risk, but sanitize for consistency)
  const csvWithHeader = [
    ['First Name', 'Last Name', 'Party Name', 'Meal Selection', 'Table'],
    ...csvData,
  ];

  const csv = Papa.unparse(csvWithHeader);

  // Create and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `guest-list-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
