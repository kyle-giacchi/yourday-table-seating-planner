import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { UIStateProvider } from '@/contexts/UIStateProvider';
import { useUIState } from '@/contexts/UIStateContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UIStateProvider>{children}</UIStateProvider>
);

describe('UIStateProvider — selection invariant', () => {
  it('starts with no selection', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });
    expect(result.current.selectedTableId).toBeNull();
    expect(result.current.selectedAssetId).toBeNull();
  });

  it('selectTable sets the table id', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.selectTable('table-1');
    });

    expect(result.current.selectedTableId).toBe('table-1');
    expect(result.current.selectedAssetId).toBeNull();
  });

  it('selectAsset sets the asset id', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.selectAsset('asset-1');
    });

    expect(result.current.selectedAssetId).toBe('asset-1');
    expect(result.current.selectedTableId).toBeNull();
  });

  it('selecting a table clears any previously selected asset (mutual exclusion)', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.selectAsset('asset-1');
    });
    expect(result.current.selectedAssetId).toBe('asset-1');

    act(() => {
      result.current.selectTable('table-1');
    });

    // The invariant: selecting one clears the other.
    expect(result.current.selectedTableId).toBe('table-1');
    expect(result.current.selectedAssetId).toBeNull();
  });

  it('selecting an asset clears any previously selected table (mutual exclusion)', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.selectTable('table-1');
    });
    expect(result.current.selectedTableId).toBe('table-1');

    act(() => {
      result.current.selectAsset('asset-1');
    });

    expect(result.current.selectedAssetId).toBe('asset-1');
    expect(result.current.selectedTableId).toBeNull();
  });

  it('passing null to selectTable does NOT clear an existing asset selection', () => {
    // The mutual-exclusion clear only fires when the new selection is non-null.
    // This guards against an asset being wiped when the user merely deselects a table.
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.selectAsset('asset-1');
    });
    act(() => {
      result.current.selectTable(null);
    });

    expect(result.current.selectedAssetId).toBe('asset-1');
    expect(result.current.selectedTableId).toBeNull();
  });

  it('clearSelection wipes both', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.selectAsset('asset-1');
    });
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedTableId).toBeNull();
    expect(result.current.selectedAssetId).toBeNull();
  });
});

describe('UIStateProvider — management mode side-effects', () => {
  it('starts in assignment mode with no guest-positions overlay', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });
    expect(result.current.managementMode).toBe('assignment');
    expect(result.current.showGuestPositionsTableId).toBeNull();
    expect(result.current.guestPositionColorMap).toEqual({});
  });

  it('switching to table-editor preserves any guest-positions state', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setShowGuestPositionsTableId('table-1');
      result.current.setGuestPositionColorMap({ 'guest-1': 0 });
    });

    act(() => {
      result.current.setManagementMode('table-editor');
    });

    expect(result.current.showGuestPositionsTableId).toBe('table-1');
    expect(result.current.guestPositionColorMap).toEqual({ 'guest-1': 0 });
  });

  it('leaving table-editor mode clears the guest-positions overlay', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setManagementMode('table-editor');
      result.current.setShowGuestPositionsTableId('table-1');
      result.current.setGuestPositionColorMap({ 'guest-1': 0 });
    });

    act(() => {
      result.current.setManagementMode('assignment');
    });

    expect(result.current.managementMode).toBe('assignment');
    expect(result.current.showGuestPositionsTableId).toBeNull();
    expect(result.current.guestPositionColorMap).toEqual({});
  });
});
