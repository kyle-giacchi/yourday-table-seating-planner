import type { Guest } from '@/types/seating';
import type { ParsedGuestData } from '@/lib/fileUtils';
import { sanitizeGuestData } from '@/lib/security';
import { ImportedGuestRowSchema } from '@/schemas/appData';
import { partyKey } from '@/utils/partyUtils';

/**
 * Strip CSV formula injection prefixes from imported values.
 * Excel/Calc treat cells starting with =, +, -, @, TAB, or CR as formulas.
 * We strip these leading characters so stored values can be safely re-exported.
 */
const stripFormulaPrefix = (value: string | undefined): string => {
  if (typeof value !== 'string') return '';
  return value.replace(/^[=+\-@\t\r]+/, '');
};

export interface GuestImportResult {
  guests: Omit<Guest, 'id'>[];
  newMealTypes: string[];
  duplicateCount: number;
  errors: string[];
}

/**
 * Build a deduplication key from name parts and party.
 * All three components are lowercased and joined with hyphens so that
 * "John Doe / Smith Family" and "john doe / smith family" are treated as
 * the same guest.
 */
const buildGuestKey = (firstName: string, lastName: string, partyName: string): string => {
  return `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${partyName.toLowerCase()}`;
};

interface NormalizedRow {
  firstName: string;
  lastName: string;
  party: string;
  mealSelection: string;
}

type RowOutcome =
  | { kind: 'ok'; row: NormalizedRow }
  | { kind: 'skip'; error: string }
  | { kind: 'invalid'; error: string };

const normalizeAndValidateRow = (raw: ParsedGuestData, rowNumber: number): RowOutcome => {
  const sanitized = sanitizeGuestData({
    firstName: stripFormulaPrefix(raw.firstName),
    lastName: stripFormulaPrefix(raw.lastName),
    party: stripFormulaPrefix(raw.partyName),
    mealSelection: stripFormulaPrefix(raw.mealSelection),
  });

  const firstName = sanitized.firstName ?? '';
  const lastName = sanitized.lastName ?? '';
  const party = sanitized.party ?? '';
  const mealSelection = sanitized.mealSelection || 'No Meal Selected';

  if (!firstName && !lastName) {
    return { kind: 'skip', error: `Skipped guest with empty name (party: "${party}")` };
  }

  const check = ImportedGuestRowSchema.safeParse({ firstName, lastName, party, mealSelection });
  if (!check.success) {
    const issue = check.error.issues[0];
    const path = issue?.path.join('.') || 'row';
    return {
      kind: 'invalid',
      error: `Row ${rowNumber}: ${path} ${issue?.message ?? 'invalid'}`,
    };
  }

  return { kind: 'ok', row: { firstName, lastName, party, mealSelection } };
};

/**
 * Process parsed guest data from a file upload into ready-to-import guest
 * objects.
 *
 * Responsibilities:
 *  - Sanitize every field using sanitizeGuestData
 *  - Detect duplicates against the current guest roster (assigned + unassigned)
 *    by matching on first name + last name + party (case-insensitive)
 *  - Build guest objects without IDs (callers assign IDs via addGuest / updateGuest)
 *  - Collect meal types that are not yet present in existingMealOptions
 *
 * This function is pure: it does not touch any context or side-effecting API.
 * The caller is responsible for persisting the results.
 */
export const processGuestImport = (
  parsedData: ParsedGuestData[],
  existingGuests: Guest[],
  existingMealOptions: string[],
): GuestImportResult => {
  const guests: Omit<Guest, 'id'>[] = [];
  const newMealTypesSet = new Set<string>();
  const errors: string[] = [];
  let duplicateCount = 0;

  // Build a lookup set from all currently known guests for O(n) duplicate checks
  const existingKeySet = new Set(
    existingGuests.map((g) => {
      const parts = g.fullName.split(' ');
      const firstName = parts[0] ?? '';
      const lastName = parts.slice(1).join(' ');
      return buildGuestKey(firstName, lastName, g.party);
    }),
  );

  // Map of lowercase party key -> canonical display casing seen in existing
  // data. New imports adopt this casing so "Smith Family" and "smith family"
  // don't fragment into two UI groups.
  const partyCasingMap = new Map<string, string>();
  existingGuests.forEach((g) => {
    const key = partyKey(g.party);
    if (key && !partyCasingMap.has(key)) partyCasingMap.set(key, g.party);
  });

  parsedData.forEach((raw, index) => {
    const outcome = normalizeAndValidateRow(raw, index + 1);
    if (outcome.kind !== 'ok') {
      errors.push(outcome.error);
      return;
    }

    const { firstName, lastName, party, mealSelection } = outcome.row;
    const key = partyKey(party);
    const canonicalParty = partyCasingMap.get(key) ?? party;
    if (key && !partyCasingMap.has(key)) partyCasingMap.set(key, canonicalParty);

    if (existingKeySet.has(buildGuestKey(firstName, lastName, canonicalParty))) {
      duplicateCount++;
    }

    guests.push({
      fullName: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      party: canonicalParty,
      mealSelection,
    });

    if (mealSelection !== 'No Meal Selected' && !existingMealOptions.includes(mealSelection)) {
      newMealTypesSet.add(mealSelection);
    }
  });

  return {
    guests,
    newMealTypes: Array.from(newMealTypesSet),
    duplicateCount,
    errors,
  };
};
