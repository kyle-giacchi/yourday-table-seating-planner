import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableAssignment } from '@/hooks/useTableAssignment';
import { createMockGuest, createMockTable } from '@/test/helpers';
import type { SeatingData } from '@/types/seating';

const mockAssignGuestToTable = vi.fn();
const mockAssignPartyToTable = vi.fn();
const mockRemoveGuestFromTable = vi.fn();
const mockRemovePartyFromTable = vi.fn();
const mockToast = vi.fn();
const mockSetLastAssignment = vi.fn();

let mockSeatingData: SeatingData = { tables: [], unassignedGuests: [] };

vi.mock('@/contexts/SeatingDataContext', () => ({
  useSeatingData: () => ({
    seatingData: mockSeatingData,
    assignGuestToTable: mockAssignGuestToTable,
    assignPartyToTable: mockAssignPartyToTable,
    removeGuestFromTable: mockRemoveGuestFromTable,
    removePartyFromTable: mockRemovePartyFromTable,
  }),
}));

vi.mock('@/contexts/UndoContext', () => ({
  useUndo: () => ({
    lastAssignment: null,
    setLastAssignment: mockSetLastAssignment,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('useTableAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSeatingData = { tables: [], unassignedGuests: [] };
  });

  it('guest within default capacity → auto-assign + success toast', async () => {
    const table = createMockTable({
      id: 't1',
      guests: [createMockGuest(), createMockGuest(), createMockGuest()],
      defaultChairs: 8,
      maxChairs: 10,
    });
    mockSeatingData = { tables: [table], unassignedGuests: [createMockGuest({ id: 'g-new' })] };

    const { result } = renderHook(() => useTableAssignment());

    let outcome = false;
    await act(async () => {
      outcome = await result.current.assignGuestWithCapacityCheck('g-new', 't1');
    });

    expect(outcome).toBe(true);
    expect(mockAssignGuestToTable).toHaveBeenCalledWith('g-new', 't1');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Guest assigned successfully' }),
    );
  });

  it('guest exceeds default capacity → modal opens', async () => {
    // 8/8 default, max 10 — adding 1 exceeds default but not max
    const guests = Array.from({ length: 8 }, (_, i) => createMockGuest({ id: `g${i}` }));
    const table = createMockTable({ id: 't1', guests, defaultChairs: 8, maxChairs: 10 });
    mockSeatingData = { tables: [table], unassignedGuests: [createMockGuest({ id: 'g-new' })] };

    const { result } = renderHook(() => useTableAssignment());

    // Don't await — the promise is held open until modal confirm/cancel
    act(() => {
      result.current.assignGuestWithCapacityCheck('g-new', 't1');
    });

    expect(result.current.capacityModal.isOpen).toBe(true);
    expect(result.current.capacityModal.data?.type).toBe('guest');
    expect(mockAssignGuestToTable).not.toHaveBeenCalled();
  });

  it('guest exceeds max capacity → error toast, returns false', async () => {
    const guests = Array.from({ length: 10 }, (_, i) => createMockGuest({ id: `g${i}` }));
    const table = createMockTable({ id: 't1', guests, defaultChairs: 8, maxChairs: 10 });
    mockSeatingData = { tables: [table], unassignedGuests: [] };

    const { result } = renderHook(() => useTableAssignment());

    let outcome = false;
    await act(async () => {
      outcome = await result.current.assignGuestWithCapacityCheck('g-new', 't1');
    });

    expect(outcome).toBe(false);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    expect(mockAssignGuestToTable).not.toHaveBeenCalled();
  });

  it('guest on missing table → returns false', async () => {
    mockSeatingData = { tables: [], unassignedGuests: [] };

    const { result } = renderHook(() => useTableAssignment());

    let outcome = false;
    await act(async () => {
      outcome = await result.current.assignGuestWithCapacityCheck('g1', 't-missing');
    });

    expect(outcome).toBe(false);
  });

  it('party within capacity → auto-assign + toast', async () => {
    const table = createMockTable({
      id: 't1',
      guests: [createMockGuest(), createMockGuest()],
      defaultChairs: 8,
      maxChairs: 10,
    });
    const partyGuests = [
      createMockGuest({ id: 'p1', party: 'Team' }),
      createMockGuest({ id: 'p2', party: 'Team' }),
      createMockGuest({ id: 'p3', party: 'Team' }),
    ];
    mockSeatingData = { tables: [table], unassignedGuests: partyGuests };

    const { result } = renderHook(() => useTableAssignment());

    let outcome = false;
    await act(async () => {
      outcome = await result.current.assignPartyWithCapacityCheck('Team', 't1');
    });

    expect(outcome).toBe(true);
    expect(mockAssignPartyToTable).toHaveBeenCalledWith('Team', 't1');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Party assigned successfully' }),
    );
  });

  it('party exceeds default capacity → modal opens', async () => {
    // 7/8 default, adding party of 2 → 9/10 — exceeds default, within max
    const existing = Array.from({ length: 7 }, (_, i) => createMockGuest({ id: `e${i}` }));
    const table = createMockTable({ id: 't1', guests: existing, defaultChairs: 8, maxChairs: 10 });
    const partyGuests = [
      createMockGuest({ id: 'p1', party: 'Pair' }),
      createMockGuest({ id: 'p2', party: 'Pair' }),
    ];
    mockSeatingData = { tables: [table], unassignedGuests: partyGuests };

    const { result } = renderHook(() => useTableAssignment());

    act(() => {
      result.current.assignPartyWithCapacityCheck('Pair', 't1');
    });

    expect(result.current.capacityModal.isOpen).toBe(true);
    expect(result.current.capacityModal.data?.type).toBe('party');
    expect(mockAssignPartyToTable).not.toHaveBeenCalled();
  });

  it('party exceeds max capacity → error toast', async () => {
    // 8/10 guests, party of 3 → 11 > max
    const existing = Array.from({ length: 8 }, (_, i) => createMockGuest({ id: `e${i}` }));
    const table = createMockTable({ id: 't1', guests: existing, defaultChairs: 8, maxChairs: 10 });
    const partyGuests = [
      createMockGuest({ id: 'p1', party: 'Big' }),
      createMockGuest({ id: 'p2', party: 'Big' }),
      createMockGuest({ id: 'p3', party: 'Big' }),
    ];
    mockSeatingData = { tables: [table], unassignedGuests: partyGuests };

    const { result } = renderHook(() => useTableAssignment());

    let outcome = false;
    await act(async () => {
      outcome = await result.current.assignPartyWithCapacityCheck('Big', 't1');
    });

    expect(outcome).toBe(false);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('empty party → returns false', async () => {
    const table = createMockTable({ id: 't1' });
    mockSeatingData = { tables: [table], unassignedGuests: [] };

    const { result } = renderHook(() => useTableAssignment());

    let outcome = false;
    await act(async () => {
      outcome = await result.current.assignPartyWithCapacityCheck('Nobody', 't1');
    });

    expect(outcome).toBe(false);
  });

  it('modal confirm → assigns + closes + resolves true', async () => {
    const guests = Array.from({ length: 8 }, (_, i) => createMockGuest({ id: `g${i}` }));
    const table = createMockTable({ id: 't1', guests, defaultChairs: 8, maxChairs: 10 });
    mockSeatingData = { tables: [table], unassignedGuests: [createMockGuest({ id: 'g-new' })] };

    const { result } = renderHook(() => useTableAssignment());

    let promise: Promise<boolean>;
    act(() => {
      promise = result.current.assignGuestWithCapacityCheck('g-new', 't1');
    });

    expect(result.current.capacityModal.isOpen).toBe(true);

    let outcome = false;
    await act(async () => {
      result.current.capacityModal.onConfirm();
      outcome = await promise;
    });

    expect(outcome).toBe(true);
    expect(mockAssignGuestToTable).toHaveBeenCalledWith('g-new', 't1');
    expect(result.current.capacityModal.isOpen).toBe(false);
  });

  it('modal cancel → closes without assign + resolves false', async () => {
    const guests = Array.from({ length: 8 }, (_, i) => createMockGuest({ id: `g${i}` }));
    const table = createMockTable({ id: 't1', guests, defaultChairs: 8, maxChairs: 10 });
    mockSeatingData = { tables: [table], unassignedGuests: [createMockGuest({ id: 'g-new' })] };

    const { result } = renderHook(() => useTableAssignment());

    let promise: Promise<boolean>;
    act(() => {
      promise = result.current.assignGuestWithCapacityCheck('g-new', 't1');
    });

    expect(result.current.capacityModal.isOpen).toBe(true);

    let outcome = false;
    await act(async () => {
      result.current.capacityModal.onCancel();
      outcome = await promise;
    });

    expect(outcome).toBe(false);
    expect(mockAssignGuestToTable).not.toHaveBeenCalled();
    expect(result.current.capacityModal.isOpen).toBe(false);
  });
});
