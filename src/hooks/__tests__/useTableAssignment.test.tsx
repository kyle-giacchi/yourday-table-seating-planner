import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SeatingDataProvider } from '@/contexts/SeatingDataProvider';
import { useSeatingData } from '@/contexts/SeatingDataContext';
import { AssignmentProvider } from '@/contexts/AssignmentProvider';
import { useTableAssignment } from '@/hooks/useTableAssignment';
import { createMockGuest, createMockTable } from '@/test/helpers';
import type { Table, Guest } from '@/types/seating';

const mockToast = vi.fn();
let mockInitialTables: Table[] = [];
let mockInitialGuests: Guest[] = [];

vi.mock('@/contexts/AppDataContext', () => ({
  useAppData: () => ({
    initialTables: mockInitialTables,
    initialGuests: mockInitialGuests,
    initialAssets: [],
    latestTables: mockInitialTables,
    latestGuests: mockInitialGuests,
    latestAssets: [],
    updateSeatingSlice: vi.fn(),
    updateAssetsSlice: vi.fn(),
    dataVersion: 0,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
  useToast: () => ({ toast: mockToast }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SeatingDataProvider>
    <AssignmentProvider>{children}</AssignmentProvider>
  </SeatingDataProvider>
);

const setup = (tables: Table[], guests: Guest[] = []) => {
  mockInitialTables = tables;
  mockInitialGuests = guests;
  return renderHook(() => ({ ...useTableAssignment(), ...useSeatingData() }), { wrapper });
};

const seated = (n: number, prefix = 's') =>
  Array.from({ length: n }, (_, i) => createMockGuest({ id: `${prefix}${i}`, party: `P${i}` }));

const tableGuestIds = (r: ReturnType<typeof setup>['result'], i = 0) =>
  r.current.seatingData.tables[i].guests.map((g) => g.id);

describe('assignment module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('guest within default → moves + toast + undo returns them', async () => {
    const { result } = setup(
      [createMockTable({ id: 't1', defaultChairs: 8, maxChairs: 10 })],
      [createMockGuest({ id: 'g1' })],
    );

    let ok = false;
    await act(async () => {
      ok = await result.current.assign({ type: 'guest', guestId: 'g1' }, 't1');
    });

    expect(ok).toBe(true);
    expect(tableGuestIds(result)).toEqual(['g1']);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Guest assigned' }));

    act(() => result.current.undoLastAssignment());
    expect(tableGuestIds(result)).toEqual([]);
    expect(result.current.seatingData.unassignedGuests.map((g) => g.id)).toEqual(['g1']);
    expect(result.current.lastAssignment).toBeNull();
  });

  it('exceeds default → one shared modal; confirm assigns', async () => {
    const { result } = setup(
      [createMockTable({ id: 't1', guests: seated(8), defaultChairs: 8, maxChairs: 10 })],
      [createMockGuest({ id: 'g-new' })],
    );

    let promise!: Promise<boolean>;
    act(() => {
      promise = result.current.assign({ type: 'guest', guestId: 'g-new' }, 't1');
    });
    expect(tableGuestIds(result)).not.toContain('g-new');

    let ok = false;
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, let my guests rub shoulders!'));
      ok = await promise;
    });

    expect(ok).toBe(true);
    expect(tableGuestIds(result)).toContain('g-new');
    expect(screen.queryByText('Yes, let my guests rub shoulders!')).toBeNull();
  });

  it('exceeds default → cancel resolves false without moving', async () => {
    const { result } = setup(
      [createMockTable({ id: 't1', guests: seated(8), defaultChairs: 8, maxChairs: 10 })],
      [createMockGuest({ id: 'g-new' })],
    );

    let promise!: Promise<boolean>;
    act(() => {
      promise = result.current.assign({ type: 'guest', guestId: 'g-new' }, 't1');
    });

    let ok = true;
    await act(async () => {
      fireEvent.click(screen.getByText("No, on second thought let's give them some space"));
      ok = await promise;
    });

    expect(ok).toBe(false);
    expect(tableGuestIds(result)).not.toContain('g-new');
  });

  it('exceeds max → destructive toast, nothing moves', async () => {
    const { result } = setup(
      [createMockTable({ id: 't1', guests: seated(10), defaultChairs: 8, maxChairs: 10 })],
      [createMockGuest({ id: 'g-new' })],
    );

    let ok = true;
    await act(async () => {
      ok = await result.current.assign({ type: 'guest', guestId: 'g-new' }, 't1');
    });

    expect(ok).toBe(false);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    expect(result.current.seatingData.unassignedGuests).toHaveLength(1);
  });

  it('cross-table guest move actually moves, and undo puts them back', async () => {
    const g = createMockGuest({ id: 'g1' });
    const { result } = setup([
      createMockTable({ id: 'a', guests: [g] }),
      createMockTable({ id: 'b' }),
    ]);

    let ok = false;
    await act(async () => {
      ok = await result.current.assign({ type: 'guest', guestId: 'g1', sourceTableId: 'a' }, 'b');
    });

    expect(ok).toBe(true);
    expect(tableGuestIds(result, 0)).toEqual([]);
    expect(tableGuestIds(result, 1)).toEqual(['g1']);

    act(() => result.current.undoLastAssignment());
    expect(tableGuestIds(result, 0)).toEqual(['g1']);
    expect(tableGuestIds(result, 1)).toEqual([]);
  });

  it('party drag moves every member regardless of name casing', async () => {
    const { result } = setup(
      [createMockTable({ id: 't1' })],
      [
        createMockGuest({ id: 'p1', party: 'Smith Family' }),
        createMockGuest({ id: 'p2', party: 'smith family' }),
        createMockGuest({ id: 'o1', party: 'Other' }),
      ],
    );

    await act(async () => {
      await result.current.assign({ type: 'party', partyName: 'SMITH FAMILY' }, 't1');
    });

    expect(tableGuestIds(result)).toEqual(['p1', 'p2']);
    expect(result.current.seatingData.unassignedGuests.map((g) => g.id)).toEqual(['o1']);
  });

  it('dropping back onto the source table is a silent no-op', async () => {
    const g = createMockGuest({ id: 'g1', party: 'X' });
    const { result } = setup([createMockTable({ id: 't1', guests: [g] })]);

    let ok = true;
    await act(async () => {
      ok = await result.current.assign(
        { type: 'party', partyName: 'X', sourceTableId: 't1' },
        't1',
      );
    });

    expect(ok).toBe(false);
    expect(mockToast).not.toHaveBeenCalled();
    expect(result.current.lastAssignment).toBeNull();
  });
});
