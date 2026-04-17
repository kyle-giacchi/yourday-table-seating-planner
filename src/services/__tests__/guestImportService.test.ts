import { describe, it, expect } from 'vitest';
import { processGuestImport } from '@/services/guestImportService';
import type { ParsedGuestData } from '@/lib/fileUtils';
import type { Guest } from '@/types/seating';

const makeParsed = (overrides: Partial<ParsedGuestData> = {}): ParsedGuestData => ({
  firstName: 'John',
  lastName: 'Smith',
  partyName: 'Smith Family',
  mealSelection: 'Chicken',
  ...overrides,
});

const makeGuest = (overrides: Partial<Guest> = {}): Guest => ({
  id: 'g1',
  fullName: 'John Smith',
  firstName: 'John',
  lastName: 'Smith',
  mealSelection: 'Chicken',
  party: 'Smith Family',
  ...overrides,
});

describe('processGuestImport', () => {
  it('parses basic guest data', () => {
    const result = processGuestImport([makeParsed()], [], ['Chicken']);

    expect(result.guests).toHaveLength(1);
    expect(result.guests[0].fullName).toBe('John Smith');
    expect(result.guests[0].party).toBe('Smith Family');
    expect(result.guests[0].mealSelection).toBe('Chicken');
    expect(result.errors).toHaveLength(0);
  });

  it('skips empty-name rows with error', () => {
    const result = processGuestImport([makeParsed({ firstName: '', lastName: '' })], [], []);

    expect(result.guests).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('empty name');
  });

  it('detects duplicates (case-insensitive)', () => {
    const existing = [makeGuest()];
    const result = processGuestImport(
      [makeParsed({ firstName: 'JOHN', lastName: 'SMITH' })],
      existing,
      ['Chicken'],
    );

    expect(result.duplicateCount).toBe(1);
    // Duplicate is still emitted so caller can decide
    expect(result.guests).toHaveLength(1);
  });

  it('detects new meal types', () => {
    const result = processGuestImport(
      [makeParsed({ mealSelection: 'Vegan' })],
      [],
      ['Chicken', 'Beef'],
    );

    expect(result.newMealTypes).toContain('Vegan');
  });

  it('does NOT count "No Meal Selected" as new', () => {
    const result = processGuestImport(
      [makeParsed({ mealSelection: 'No Meal Selected' })],
      [],
      ['Chicken'],
    );

    expect(result.newMealTypes).toHaveLength(0);
  });

  it('defaults empty meal to "No Meal Selected"', () => {
    const result = processGuestImport([makeParsed({ mealSelection: '' })], [], []);

    expect(result.guests[0].mealSelection).toBe('No Meal Selected');
  });

  it('strips CSV formula prefixes (=+\\-@\\t\\r)', () => {
    const result = processGuestImport(
      [
        makeParsed({
          firstName: '=CMD("bad")',
          lastName: '+Smith',
          partyName: '-Party',
          mealSelection: '@Vegan',
        }),
      ],
      [],
      [],
    );

    const guest = result.guests[0];
    expect(guest.firstName).not.toMatch(/^[=+\-@\t\r]/);
    expect(guest.lastName).not.toMatch(/^[=+\-@\t\r]/);
    expect(guest.party).not.toMatch(/^[=+\-@\t\r]/);
    expect(guest.mealSelection).not.toMatch(/^[=+\-@\t\r]/);
  });

  it('handles multiple guests from same party', () => {
    const result = processGuestImport(
      [
        makeParsed({ firstName: 'Alice', lastName: 'Brown', partyName: 'Brown Family' }),
        makeParsed({ firstName: 'Bob', lastName: 'Brown', partyName: 'Brown Family' }),
        makeParsed({ firstName: 'Charlie', lastName: 'Brown', partyName: 'Brown Family' }),
      ],
      [],
      ['Chicken'],
    );

    expect(result.guests).toHaveLength(3);
    expect(result.guests.every((g) => g.party === 'Brown Family')).toBe(true);
  });

  it('processes mixed valid/invalid rows', () => {
    const result = processGuestImport(
      [
        makeParsed({ firstName: 'Alice', lastName: 'Green' }),
        makeParsed({ firstName: '', lastName: '' }), // invalid
        makeParsed({ firstName: 'Bob', lastName: 'Green' }),
      ],
      [],
      ['Chicken'],
    );

    expect(result.guests).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
  });

  it('returns empty results for empty input', () => {
    const result = processGuestImport([], [], []);

    expect(result.guests).toHaveLength(0);
    expect(result.newMealTypes).toHaveLength(0);
    expect(result.duplicateCount).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  describe('canonical party casing (C8)', () => {
    it('adopts the casing of an existing guest with a same-key party', () => {
      const existing = [makeGuest({ id: 'g1', party: 'Smith Family' })];
      const result = processGuestImport(
        [makeParsed({ firstName: 'Jane', lastName: 'Smith', partyName: 'smith family' })],
        existing,
        ['Chicken'],
      );

      expect(result.guests[0].party).toBe('Smith Family');
    });

    it('first-seen import casing wins when no existing guest anchors the party', () => {
      const result = processGuestImport(
        [
          makeParsed({ firstName: 'Alice', lastName: 'A', partyName: 'Smith Family' }),
          makeParsed({ firstName: 'Bob', lastName: 'B', partyName: 'SMITH FAMILY' }),
          makeParsed({ firstName: 'Carol', lastName: 'C', partyName: 'smith family' }),
        ],
        [],
        ['Chicken'],
      );

      expect(result.guests.every((g) => g.party === 'Smith Family')).toBe(true);
    });

    it('duplicates are detected across casing', () => {
      const existing = [makeGuest({ id: 'g1', fullName: 'John Smith', party: 'Smith Family' })];
      const result = processGuestImport(
        [makeParsed({ firstName: 'john', lastName: 'smith', partyName: 'SMITH FAMILY' })],
        existing,
        ['Chicken'],
      );

      expect(result.duplicateCount).toBe(1);
    });
  });
});
