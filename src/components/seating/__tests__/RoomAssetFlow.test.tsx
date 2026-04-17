import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

beforeAll(() => {
  // jsdom does not include ResizeObserver — stub it so SeatingCanvas can mount.
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

import { SeatingDataProvider } from '@/contexts/SeatingDataProvider';
import { UndoProvider } from '@/contexts/UndoProvider';
import { UIStateProvider } from '@/contexts/UIStateProvider';
import { RoomProvider } from '@/contexts/RoomProvider';
import { AddAssetDropdown } from '@/components/seating/AddAssetDropdown';
import { SeatingCanvas } from '@/components/seating/SeatingCanvas';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUpdateSeatingSlice = vi.fn();
const mockUpdateAssetsSlice = vi.fn();
const mockUpdateSettingsSlice = vi.fn();

vi.mock('@/contexts/AppDataContext', () => ({
  useAppData: () => ({
    initialTables: [],
    initialGuests: [],
    initialAssets: [],
    latestTables: [],
    latestGuests: [],
    latestAssets: [],
    settings: {
      backgroundImage: { backgroundImage: null, imageOpacity: 1 },
      roomOutline: { walls: [], doors: [], windows: [] },
      isReferenceLocked: false,
      referenceObject: null,
      scaleInfo: null,
    },
    version: 1,
    dataVersion: 0,
    updateSeatingSlice: mockUpdateSeatingSlice,
    updateAssetsSlice: mockUpdateAssetsSlice,
    updateSettingsSlice: mockUpdateSettingsSlice,
  }),
}));

// useToast is used by AddAssetDropdown — stub it so it doesn't need a Toaster
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Provider wrapper
// ---------------------------------------------------------------------------

const AllProviders = ({ children }: { children: ReactNode }) => (
  <SeatingDataProvider>
    <UndoProvider>
      <UIStateProvider>
        <RoomProvider>{children}</RoomProvider>
      </UIStateProvider>
    </UndoProvider>
  </SeatingDataProvider>
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Room asset flow (smoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Regression: assets must be interactive in the default 'assignment' mode,
  // not just in 'table-editor'. Previously RoomAssetView gated drag/select on
  // managementMode === 'table-editor', which silently broke every user who
  // added an asset from the default panel mode.
  it('adds an asset and removes it via the pill (default assignment mode)', async () => {
    const user = userEvent.setup();

    render(
      <AllProviders>
        <AddAssetDropdown />
        <SeatingCanvas />
      </AllProviders>,
    );

    // Open the "Add Asset" dropdown via userEvent (fires pointer + click events Radix expects)
    await user.click(screen.getByRole('button', { name: /add asset/i }));

    // Click the "Serving Table" menu item
    const item = await screen.findByRole('menuitem', { name: /serving table/i });
    await user.click(item);

    // The asset should appear in the canvas
    const asset = await screen.findByRole('button', { name: /room asset: serving-table/i });
    expect(asset).toBeInTheDocument();

    // Click the asset to select it (fires the onMouseUp → selectAsset path)
    await user.click(asset);

    // The delete pill should be visible
    const deleteBtn = await screen.findByRole('button', { name: /delete asset/i });
    await user.click(deleteBtn);

    // Asset should be gone
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /room asset: serving-table/i }),
      ).not.toBeInTheDocument();
    });
  });
});
