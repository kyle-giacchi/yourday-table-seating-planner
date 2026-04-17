import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AppDataProvider } from '@/contexts/AppDataProvider';
import { useAppData } from '@/contexts/AppDataContext';
import { STORAGE_KEY } from '@/services/DataRepository';
import { CURRENT_VERSION } from '@/utils/migrations';

const baseAppData = {
  version: CURRENT_VERSION,
  lastModified: Date.now(),
  tables: [],
  guests: [],
  assets: [],
  settings: {
    roomOutline: {
      x: 25,
      y: 20,
      width: 50,
      height: 50,
      realWorldWidth: 20,
      realWorldHeight: 20,
      isVisible: true,
    },
    roomBorder: {
      x: 20,
      y: 15,
      width: 60,
      height: 60,
      realWorldWidth: 20,
      realWorldHeight: 20,
      isVisible: false,
    },
    backgroundImage: { backgroundImage: null, imageOpacity: 0.3 },
    isReferenceLocked: false,
  },
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppDataProvider>{children}</AppDataProvider>
);

describe('AppDataProvider — multi-tab sync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initial state reflects what is in localStorage', () => {
    const seeded = {
      ...baseAppData,
      guests: [
        {
          id: 'seed1',
          fullName: 'Seed Guest',
          firstName: 'Seed',
          lastName: 'Guest',
          party: 'Seed Party',
          mealSelection: 'Chicken',
        },
      ],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    const { result } = renderHook(() => useAppData(), { wrapper });
    expect(result.current.latestGuests).toHaveLength(1);
    expect(result.current.latestGuests[0].fullName).toBe('Seed Guest');
  });

  it('storage event from another tab reloads state and bumps dataVersion', () => {
    const { result } = renderHook(() => useAppData(), { wrapper });
    const initialVersion = result.current.dataVersion;
    expect(result.current.latestGuests).toHaveLength(0);

    const updated = {
      ...baseAppData,
      guests: [
        {
          id: 'tab-a',
          fullName: 'From Tab A',
          firstName: 'From',
          lastName: 'Tab',
          party: 'Remote',
          mealSelection: 'Beef',
        },
      ],
    };
    const newValue = JSON.stringify(updated);
    // Simulate the browser writing the same key in another tab, then firing
    // the cross-tab storage event on this tab.
    localStorage.setItem(STORAGE_KEY, newValue);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue,
          oldValue: null,
        }),
      );
    });

    expect(result.current.latestGuests).toHaveLength(1);
    expect(result.current.latestGuests[0].fullName).toBe('From Tab A');
    expect(result.current.dataVersion).toBe(initialVersion + 1);
  });

  it('ignores storage events for unrelated keys', () => {
    const { result } = renderHook(() => useAppData(), { wrapper });
    const initialVersion = result.current.dataVersion;

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'some-other-key',
          newValue: 'anything',
        }),
      );
    });

    expect(result.current.dataVersion).toBe(initialVersion);
  });

  it('ignores storage clear events (newValue === null)', () => {
    const { result } = renderHook(() => useAppData(), { wrapper });
    const initialVersion = result.current.dataVersion;

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: null,
          oldValue: 'something',
        }),
      );
    });

    expect(result.current.dataVersion).toBe(initialVersion);
  });
});
