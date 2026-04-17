import Papa from 'papaparse';

const MAX_IMPORT_ROWS = 500;

export interface ParsedGuestData {
  firstName: string;
  lastName: string;
  partyName: string;
  mealSelection?: string;
  table?: string;
}

export interface FileParseResult {
  success: boolean;
  data: ParsedGuestData[];
  errors: string[];
  totalRows: number;
}

const EXPECTED_HEADER_TOKENS = ['first', 'last', 'party'];

/**
 * Detect whether a row looks like a header row (contains the words "first",
 * "last", and "party" somewhere in the first three cells). Used to skip the
 * header line on imports so users don't accidentally create a guest named
 * "First Name Last Name".
 */
const looksLikeHeaderRow = (row: unknown[]): boolean => {
  if (!Array.isArray(row) || row.length < 3) return false;
  const joined = row
    .slice(0, 5)
    .map((cell) => (cell ?? '').toString().toLowerCase())
    .join(' ');
  return EXPECTED_HEADER_TOKENS.every((tok) => joined.includes(tok));
};

/**
 * Heuristic detection of a mis-ordered header row. The file starts with a
 * header-like row (contains label-style strings in cells that should be
 * names, e.g. "Name, Email, Phone") but doesn't match our expected tokens.
 * Example: a CSV with columns [Name, Email, Phone] was previously imported
 * silently as a guest named "Name Email".
 */
const looksLikeWrongHeaderRow = (row: unknown[]): boolean => {
  if (!Array.isArray(row) || row.length < 3) return false;
  const cells = row.slice(0, 3).map((cell) => (cell ?? '').toString().trim());
  if (cells.some((c) => !c)) return false;
  // Short single-word labels like "Name", "Email", "Phone" — typical of header rows
  const allLabelish = cells.every((c) => c.length < 30 && /^[A-Za-z][A-Za-z0-9 _/-]*$/.test(c));
  if (!allLabelish) return false;
  const lower = cells.join(' ').toLowerCase();
  // Strong signals that this is a header, not a real guest row
  const headerKeywords = ['name', 'email', 'phone', 'guest', 'attendee', 'id', 'address'];
  return headerKeywords.some((k) => lower.includes(k));
};

interface ProcessedRows {
  data: ParsedGuestData[];
  errors: string[];
}

type RowOutcome =
  | { kind: 'ok'; row: ParsedGuestData }
  | { kind: 'error'; message: string }
  | { kind: 'skip' };

const parseGuestRow = (row: unknown, rowNumber: number): RowOutcome => {
  if (!Array.isArray(row)) return { kind: 'skip' };
  if (row.length === 0) return { kind: 'skip' };
  if (row.length < 3) {
    return {
      kind: 'error',
      message: `Row ${rowNumber}: Invalid format - expected at least 3 columns`,
    };
  }
  const firstName = row[0]?.toString().trim();
  const lastName = row[1]?.toString().trim();
  const partyName = row[2]?.toString().trim();
  const mealSelection = row[3]?.toString().trim() || undefined;
  const table = row[4]?.toString().trim() || undefined;

  if (!firstName || !lastName || !partyName) {
    return {
      kind: 'error',
      message: `Row ${rowNumber}: Missing required fields (First Name, Last Name, or Party Name)`,
    };
  }
  return { kind: 'ok', row: { firstName, lastName, partyName, mealSelection, table } };
};

/**
 * Shared row processor for both CSV and Excel imports.
 *
 * - If row 1 looks like our expected header ("first", "last", "party"), it's
 *   skipped silently (so the downloaded template re-imports cleanly).
 * - If row 1 looks like a *different* header (e.g. columns are misordered as
 *   "Name, Email, Phone"), the whole import is rejected with a clear error so
 *   the user doesn't end up with a guest named after their column labels.
 */
const processRows = (rows: unknown[][]): ProcessedRows => {
  const data: ParsedGuestData[] = [];
  const errors: string[] = [];

  if (rows.length === 0) return { data, errors };

  const firstRow = rows[0];
  if (looksLikeWrongHeaderRow(firstRow) && !looksLikeHeaderRow(firstRow)) {
    errors.push(
      "The file header doesn't match the expected format. Required columns in order: First Name, Last Name, Party Name, Meal Selection (optional), Table (optional). Download the template for a working example.",
    );
    return { data, errors };
  }

  const startIndex = looksLikeHeaderRow(firstRow) ? 1 : 0;

  for (let index = startIndex; index < rows.length; index++) {
    const outcome = parseGuestRow(rows[index], index + 1);
    if (outcome.kind === 'ok') data.push(outcome.row);
    else if (outcome.kind === 'error') errors.push(outcome.message);
  }

  return { data, errors };
};

export const parseCSVFile = (file: File): Promise<FileParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > MAX_IMPORT_ROWS) {
          resolve({
            success: false,
            data: [],
            errors: [`File exceeds maximum of ${MAX_IMPORT_ROWS} rows`],
            totalRows: results.data.length,
          });
          return;
        }

        const { data, errors } = processRows(results.data as unknown[][]);

        resolve({
          success: errors.length === 0,
          data,
          errors,
          totalRows: results.data.length,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [`CSV parsing error: ${error.message}`],
          totalRows: 0,
        });
      },
    });
  });
};

/**
 * Safely extracts a string value from an exceljs cell value.
 * Cell values can be primitives, rich text objects, hyperlink objects, or formula results.
 */
function getCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value instanceof Date) return value.toISOString();
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.richText))
      return obj.richText.map((rt: Record<string, unknown>) => rt.text).join('');
    if (typeof obj.text === 'string') return obj.text;
    if (obj.result !== undefined) return String(obj.result);
    return String(value);
  }
  return String(value);
}

export const parseExcelFile = async (file: File): Promise<FileParseResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return {
        success: false,
        data: [],
        errors: ['Excel file contains no worksheets'],
        totalRows: 0,
      };
    }

    // Convert worksheet rows to array-of-arrays (same format xlsx sheet_to_json with header:1 produced)
    const jsonData: string[][] = [];
    worksheet.eachRow((row) => {
      // row.values is 1-indexed (index 0 is undefined), so slice(1) for 0-indexed columns
      const rowValues = (row.values as unknown[]).slice(1).map(getCellValue);
      jsonData.push(rowValues);
    });

    if (jsonData.length > MAX_IMPORT_ROWS) {
      return {
        success: false,
        data: [],
        errors: [`File exceeds maximum of ${MAX_IMPORT_ROWS} rows`],
        totalRows: jsonData.length,
      };
    }

    const { data: parsedData, errors } = processRows(jsonData);

    return {
      success: errors.length === 0,
      data: parsedData,
      errors,
      totalRows: jsonData.length,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      totalRows: 0,
    };
  }
};

export const validateFileType = (file: File): boolean => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  const allowedExtensions = ['.csv', '.xlsx'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
};
