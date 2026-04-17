import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { SeatingDataProvider } from '@/contexts/SeatingDataProvider';
import { useSeatingData } from '@/contexts/SeatingDataContext';

const mockUpdateSeatingSlice = vi.fn();
const mockUpdateAssetsSlice = vi.fn();

vi.mock('@/contexts/AppDataContext', () => ({
  useAppData: () => ({
    initialTables: [],
    initialGuests: [],
    initialAssets: [],
    latestTables: [],
    latestGuests: [],
    latestAssets: [],
    updateSeatingSlice: mockUpdateSeatingSlice,
    updateAssetsSlice: mockUpdateAssetsSlice,
    dataVersion: 0,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SeatingDataProvider>{children}</SeatingDataProvider>
);

describe('SeatingDataProvider — assets slice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with empty assets', () => {
    const { result } = renderHook(() => useSeatingData(), { wrapper });
    expect(result.current.assets).toEqual([]);
  });

  it('addAsset appends a new asset with generated id', () => {
    const { result } = renderHook(() => useSeatingData(), { wrapper });
    act(() => {
      result.current.addAsset({ type: 'speaker', x: 100, y: 100, rotation: 0 });
    });
    expect(result.current.assets).toHaveLength(1);
    expect(result.current.assets[0].type).toBe('speaker');
    expect(result.current.assets[0].id).toMatch(/^asset-/);
  });

  it('updateAsset mutates only the targeted id', () => {
    const { result } = renderHook(() => useSeatingData(), { wrapper });
    act(() => {
      result.current.addAsset({ type: 'speaker', x: 0, y: 0, rotation: 0 });
      result.current.addAsset({ type: 'dj-setup', x: 0, y: 0, rotation: 0 });
    });
    const targetId = result.current.assets[0].id;
    act(() => {
      result.current.updateAsset(targetId, { x: 999 });
    });
    expect(result.current.assets[0].x).toBe(999);
    expect(result.current.assets[1].x).toBe(0);
  });

  it('removeAsset filters by id', () => {
    const { result } = renderHook(() => useSeatingData(), { wrapper });
    act(() => {
      result.current.addAsset({ type: 'speaker', x: 0, y: 0, rotation: 0 });
    });
    const id = result.current.assets[0].id;
    act(() => {
      result.current.removeAsset(id);
    });
    expect(result.current.assets).toHaveLength(0);
  });
});
