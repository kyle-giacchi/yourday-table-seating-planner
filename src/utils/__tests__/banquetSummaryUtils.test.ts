import { describe, it, expect } from 'vitest';
import { buildBanquetSummary } from '@/utils/banquetSummaryUtils';
import { createMockGuest, createMockTable } from '@/test/helpers';

describe('buildBanquetSummary.tableAssignments', () => {
  it('includes table size, shape, capacity, defaultChairs, and isHeadTable', () => {
    const head = createMockTable({
      name: 'Head Table',
      tableNumber: 3,
      tableSize: '96" x 30"',
      shape: 'rectangle',
      capacity: 8,
      defaultChairs: 8,
      isHeadTable: true,
      guests: [createMockGuest({ fullName: 'Alice Smith' })],
    });
    const regular = createMockTable({
      name: 'Table 1',
      tableNumber: 1,
      tableSize: '60" diameter',
      shape: 'round',
      capacity: 10,
      defaultChairs: 8,
      guests: [createMockGuest({ fullName: 'Bob Jones' })],
    });
    const summary = buildBanquetSummary([head, regular], []);

    expect(summary.tableAssignments).toHaveLength(2);
    expect(summary.tableAssignments[0].tableName).toBe('Head Table');
    expect(summary.tableAssignments[0].isHeadTable).toBe(true);
    expect(summary.tableAssignments[0].tableSize).toBe('96" x 30"');
    expect(summary.tableAssignments[0].shape).toBe('rectangle');
    expect(summary.tableAssignments[0].capacity).toBe(8);
    expect(summary.tableAssignments[0].defaultChairs).toBe(8);
    expect(summary.tableAssignments[1].tableName).toBe('Table 1');
    expect(summary.tableAssignments[1].isHeadTable).toBeFalsy();
  });

  it('propagates per-guest allergyFlags and dietaryNotes', () => {
    const table = createMockTable({
      guests: [
        createMockGuest({
          fullName: 'Alice Smith',
          allergyFlags: ['nut', 'gluten'],
          dietaryNotes: 'Severe peanut allergy',
        }),
      ],
    });
    const summary = buildBanquetSummary([table], []);
    const guest = summary.tableAssignments[0].guests[0];
    expect(guest.allergyFlags).toEqual(['nut', 'gluten']);
    expect(guest.dietaryNotes).toBe('Severe peanut allergy');
  });
});
