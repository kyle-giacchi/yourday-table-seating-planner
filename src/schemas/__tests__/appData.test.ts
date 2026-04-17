import { describe, it, expect } from 'vitest';
import { GuestSchema, TableSchema } from '@/schemas/appData';

describe('GuestSchema', () => {
  it('accepts the minimum required guest shape', () => {
    const result = GuestSchema.safeParse({
      id: 'g1',
      fullName: 'Alice Smith',
      mealSelection: 'Chicken',
      party: 'Smith Family',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a guest with allergyFlags, dietaryNotes, and rsvpStatus', () => {
    const result = GuestSchema.safeParse({
      id: 'g1',
      fullName: 'Alice Smith',
      mealSelection: 'Chicken',
      party: 'Smith Family',
      allergyFlags: ['nut', 'gluten'],
      dietaryNotes: 'Severe peanut allergy, bring epipen',
      rsvpStatus: 'attending',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown allergy flag', () => {
    const result = GuestSchema.safeParse({
      id: 'g1',
      fullName: 'Alice',
      mealSelection: 'Chicken',
      party: '',
      allergyFlags: ['chocolate'],
    });
    expect(result.success).toBe(false);
  });
});

describe('TableSchema', () => {
  it('accepts a table with isHeadTable=true', () => {
    const result = TableSchema.safeParse({
      id: 't1',
      x: 0,
      y: 0,
      shape: 'round',
      capacity: 8,
      guests: [],
      name: 'Head Table',
      tableNumber: 1,
      tableSize: '60" diameter',
      commonUse: 'Head',
      defaultChairs: 8,
      maxChairs: 10,
      isHeadTable: true,
    });
    expect(result.success).toBe(true);
  });
});
