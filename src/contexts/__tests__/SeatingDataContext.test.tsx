import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { SeatingDataProvider } from '@/contexts/SeatingDataProvider';
import { useSeatingData } from '@/contexts/SeatingDataContext';
import { createMockGuest, createMockTable } from '@/test/helpers';
import type { Table, Guest } from '@/types/seating';

const mockUpdateSeatingSlice = vi.fn();

let mockInitialTables: Table[] = [];
let mockInitialGuests: Guest[] = [];

vi.mock('@/contexts/AppDataContext', () => ({
  useAppData: () => ({
    initialTables: mockInitialTables,
    initialGuests: mockInitialGuests,
    latestTables: mockInitialTables,
    latestGuests: mockInitialGuests,
    updateSeatingSlice: mockUpdateSeatingSlice,
    dataVersion: 0,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SeatingDataProvider>{children}</SeatingDataProvider>
);

describe('SeatingDataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInitialTables = [];
    mockInitialGuests = [];
  });

  it('initial state matches provided data', () => {
    const guest = createMockGuest({ id: 'g1' });
    const table = createMockTable({ id: 't1' });
    mockInitialTables = [table];
    mockInitialGuests = [guest];

    const { result } = renderHook(() => useSeatingData(), { wrapper });

    expect(result.current.seatingData.tables).toHaveLength(1);
    expect(result.current.seatingData.tables[0].id).toBe('t1');
    expect(result.current.seatingData.unassignedGuests).toHaveLength(1);
    expect(result.current.seatingData.unassignedGuests[0].id).toBe('g1');
  });

  it('addTable creates table with auto ID/name/number', () => {
    const { result } = renderHook(() => useSeatingData(), { wrapper });

    act(() => {
      result.current.addTable({
        x: 200,
        y: 200,
        shape: 'round',
        capacity: 8,
        guests: [],
        tableSize: '60" diameter',
        commonUse: 'General',
        defaultChairs: 8,
        maxChairs: 10,
      });
    });

    expect(result.current.seatingData.tables).toHaveLength(1);
    const added = result.current.seatingData.tables[0];
    expect(added.id).toBeTruthy();
    expect(added.name).toMatch(/^Table \d+$/);
    expect(added.tableNumber).toBeGreaterThan(0);
  });

  it('addGuest creates guest with auto ID', () => {
    const { result } = renderHook(() => useSeatingData(), { wrapper });

    act(() => {
      result.current.addGuest({
        fullName: 'Bob Test',
        firstName: 'Bob',
        lastName: 'Test',
        mealSelection: 'Chicken',
        party: 'Test Family',
      });
    });

    expect(result.current.seatingData.unassignedGuests).toHaveLength(1);
    expect(result.current.seatingData.unassignedGuests[0].id).toBeTruthy();
    expect(result.current.seatingData.unassignedGuests[0].fullName).toBe('Bob Test');
  });

  it('addGuest preserves existing ID when provided', () => {
    const { result } = renderHook(() => useSeatingData(), { wrapper });

    act(() => {
      result.current.addGuest({
        id: 'keep-me',
        fullName: 'Existing',
        firstName: 'Existing',
        lastName: '',
        mealSelection: 'Chicken',
        party: 'Party',
      });
    });

    expect(result.current.seatingData.unassignedGuests[0].id).toBe('keep-me');
  });

  it('removeTable removes by ID', () => {
    const table = createMockTable({ id: 't-remove' });
    mockInitialTables = [table];

    const { result } = renderHook(() => useSeatingData(), { wrapper });
    expect(result.current.seatingData.tables).toHaveLength(1);

    act(() => {
      result.current.removeTable('t-remove');
    });
    expect(result.current.seatingData.tables).toHaveLength(0);
  });

  it('removeGuest from unassigned list', () => {
    const guest = createMockGuest({ id: 'g-remove' });
    mockInitialGuests = [guest];

    const { result } = renderHook(() => useSeatingData(), { wrapper });
    expect(result.current.seatingData.unassignedGuests).toHaveLength(1);

    act(() => {
      result.current.removeGuest('g-remove');
    });
    expect(result.current.seatingData.unassignedGuests).toHaveLength(0);
  });

  it('removeGuest from table (assigned guest)', () => {
    const guest = createMockGuest({ id: 'g-assigned' });
    const table = createMockTable({ id: 't1', guests: [guest] });
    mockInitialTables = [table];

    const { result } = renderHook(() => useSeatingData(), { wrapper });
    expect(result.current.seatingData.tables[0].guests).toHaveLength(1);

    act(() => {
      result.current.removeGuest('g-assigned');
    });
    expect(result.current.seatingData.tables[0].guests).toHaveLength(0);
  });

  it('moveGuests moves guest to table', () => {
    const guest = createMockGuest({ id: 'g1' });
    const table = createMockTable({ id: 't1' });
    mockInitialGuests = [guest];
    mockInitialTables = [table];

    const { result } = renderHook(() => useSeatingData(), { wrapper });

    act(() => {
      result.current.moveGuests(['g1'], 't1');
    });

    expect(result.current.seatingData.unassignedGuests).toHaveLength(0);
    expect(result.current.seatingData.tables[0].guests).toHaveLength(1);
    expect(result.current.seatingData.tables[0].guests[0].id).toBe('g1');
  });

  it('moveGuests no-op for non-existent guest', () => {
    const table = createMockTable({ id: 't1' });
    mockInitialTables = [table];

    const { result } = renderHook(() => useSeatingData(), { wrapper });

    act(() => {
      result.current.moveGuests(['non-existent'], 't1');
    });

    expect(result.current.seatingData.tables[0].guests).toHaveLength(0);
  });

  it('removeGuestFromTable returns guest to unassigned', () => {
    const guest = createMockGuest({ id: 'g1' });
    const table = createMockTable({ id: 't1', guests: [guest] });
    mockInitialTables = [table];

    const { result } = renderHook(() => useSeatingData(), { wrapper });

    act(() => {
      result.current.removeGuestFromTable('g1');
    });

    expect(result.current.seatingData.tables[0].guests).toHaveLength(0);
    expect(result.current.seatingData.unassignedGuests).toHaveLength(1);
    expect(result.current.seatingData.unassignedGuests[0].id).toBe('g1');
  });

  it('moveGuests moves several guests at once', () => {
    const g1 = createMockGuest({ id: 'p1', party: 'Smiths', fullName: 'A Smith' });
    const g2 = createMockGuest({ id: 'p2', party: 'Smiths', fullName: 'B Smith' });
    const g3 = createMockGuest({ id: 'p3', party: 'Other', fullName: 'C Other' });
    const table = createMockTable({ id: 't1' });
    mockInitialGuests = [g1, g2, g3];
    mockInitialTables = [table];

    const { result } = renderHook(() => useSeatingData(), { wrapper });

    act(() => {
      result.current.moveGuests(['p1', 'p2'], 't1');
    });

    expect(result.current.seatingData.tables[0].guests).toHaveLength(2);
    expect(result.current.seatingData.unassignedGuests).toHaveLength(1);
    expect(result.current.seatingData.unassignedGuests[0].party).toBe('Other');
  });

  it('moveGuests no-op for empty list', () => {
    const table = createMockTable({ id: 't1' });
    mockInitialTables = [table];

    const { result } = renderHook(() => useSeatingData(), { wrapper });

    act(() => {
      result.current.moveGuests([], 't1');
    });

    expect(result.current.seatingData.tables[0].guests).toHaveLength(0);
  });

  it('removePartyFromTable returns party to unassigned', () => {
    const g1 = createMockGuest({ id: 'p1', party: 'Jones' });
    const g2 = createMockGuest({ id: 'p2', party: 'Jones' });
    const table = createMockTable({ id: 't1', guests: [g1, g2] });
    mockInitialTables = [table];

    const { result } = renderHook(() => useSeatingData(), { wrapper });

    act(() => {
      result.current.removePartyFromTable('Jones', 't1');
    });

    expect(result.current.seatingData.tables[0].guests).toHaveLength(0);
    expect(result.current.seatingData.unassignedGuests).toHaveLength(2);
  });

  it('updateGuest on unassigned guest', () => {
    const guest = createMockGuest({ id: 'g1', mealSelection: 'Chicken' });
    mockInitialGuests = [guest];

    const { result } = renderHook(() => useSeatingData(), { wrapper });

    act(() => {
      result.current.updateGuest('g1', { mealSelection: 'Beef' });
    });

    expect(result.current.seatingData.unassignedGuests[0].mealSelection).toBe('Beef');
  });

  it('updateGuest on assigned guest', () => {
    const guest = createMockGuest({ id: 'g1', mealSelection: 'Chicken' });
    const table = createMockTable({ id: 't1', guests: [guest] });
    mockInitialTables = [table];

    const { result } = renderHook(() => useSeatingData(), { wrapper });

    act(() => {
      result.current.updateGuest('g1', { mealSelection: 'Fish' });
    });

    expect(result.current.seatingData.tables[0].guests[0].mealSelection).toBe('Fish');
  });

  // --- C6: removeTable moves guests back to unassigned ---

  describe('removeTable cascade', () => {
    it('moves seated guests back to the unassigned list when the table is deleted', () => {
      const g1 = createMockGuest({ id: 'g1', party: 'Smith' });
      const g2 = createMockGuest({ id: 'g2', party: 'Smith' });
      const g3 = createMockGuest({ id: 'g3', party: 'Jones' });
      const table = createMockTable({ id: 't-cascade', guests: [g1, g2, g3] });
      mockInitialTables = [table];

      const { result } = renderHook(() => useSeatingData(), { wrapper });
      expect(result.current.seatingData.unassignedGuests).toHaveLength(0);

      act(() => {
        result.current.removeTable('t-cascade');
      });

      expect(result.current.seatingData.tables).toHaveLength(0);
      expect(result.current.seatingData.unassignedGuests).toHaveLength(3);
      const names = result.current.seatingData.unassignedGuests.map((g) => g.id);
      expect(names).toEqual(expect.arrayContaining(['g1', 'g2', 'g3']));
    });

    it('removes an empty table without adding phantom guests', () => {
      const table = createMockTable({ id: 't-empty', guests: [] });
      mockInitialTables = [table];

      const { result } = renderHook(() => useSeatingData(), { wrapper });

      act(() => {
        result.current.removeTable('t-empty');
      });

      expect(result.current.seatingData.tables).toHaveLength(0);
      expect(result.current.seatingData.unassignedGuests).toHaveLength(0);
    });

    it('is a no-op when the table id does not exist', () => {
      const table = createMockTable({ id: 'other' });
      mockInitialTables = [table];

      const { result } = renderHook(() => useSeatingData(), { wrapper });

      act(() => {
        result.current.removeTable('missing-id');
      });

      expect(result.current.seatingData.tables).toHaveLength(1);
    });
  });

  // --- B4: updateTable rejects capacity reductions below occupants ---

  describe('updateTable capacity guard', () => {
    it('rejects maxChairs reductions below current guest count', () => {
      const guests = [
        createMockGuest({ id: 'g1' }),
        createMockGuest({ id: 'g2' }),
        createMockGuest({ id: 'g3' }),
        createMockGuest({ id: 'g4' }),
        createMockGuest({ id: 'g5' }),
      ];
      const table = createMockTable({ id: 't1', guests, maxChairs: 10, defaultChairs: 8 });
      mockInitialTables = [table];

      const { result } = renderHook(() => useSeatingData(), { wrapper });

      act(() => {
        result.current.updateTable('t1', { maxChairs: 3 });
      });

      expect(result.current.seatingData.tables[0].maxChairs).toBe(10);
    });

    it('rejects defaultChairs reductions below current guest count', () => {
      const guests = [createMockGuest({ id: 'g1' }), createMockGuest({ id: 'g2' })];
      const table = createMockTable({ id: 't1', guests, defaultChairs: 6, maxChairs: 8 });
      mockInitialTables = [table];

      const { result } = renderHook(() => useSeatingData(), { wrapper });

      act(() => {
        result.current.updateTable('t1', { defaultChairs: 1 });
      });

      expect(result.current.seatingData.tables[0].defaultChairs).toBe(6);
    });

    it('allows increases and lateral capacity changes', () => {
      const guests = [createMockGuest({ id: 'g1' }), createMockGuest({ id: 'g2' })];
      const table = createMockTable({ id: 't1', guests, defaultChairs: 4, maxChairs: 6 });
      mockInitialTables = [table];

      const { result } = renderHook(() => useSeatingData(), { wrapper });

      act(() => {
        result.current.updateTable('t1', { maxChairs: 12 });
      });

      expect(result.current.seatingData.tables[0].maxChairs).toBe(12);
    });

    it('allows position updates without touching capacity guard', () => {
      const table = createMockTable({
        id: 't1',
        x: 0,
        y: 0,
        guests: [createMockGuest({ id: 'g1' })],
        maxChairs: 1,
      });
      mockInitialTables = [table];

      const { result } = renderHook(() => useSeatingData(), { wrapper });

      act(() => {
        result.current.updateTable('t1', { x: 250, y: 300 });
      });

      expect(result.current.seatingData.tables[0].x).toBe(250);
      expect(result.current.seatingData.tables[0].y).toBe(300);
      // maxChairs untouched
      expect(result.current.seatingData.tables[0].maxChairs).toBe(1);
    });
  });
});
