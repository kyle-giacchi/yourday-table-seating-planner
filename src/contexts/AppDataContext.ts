import { createContext, useContext } from 'react';
import type { AppSettings } from '@/types/appData';
import type { Table, Guest, RoomAsset } from '@/types/seating';

export interface AppDataContextType {
  /** Initial tables loaded from storage (consumed by SeatingDataProvider on mount) */
  initialTables: Table[];
  /** Initial guests loaded from storage (consumed by SeatingDataProvider on mount) */
  initialGuests: Guest[];
  /** Initial assets loaded from storage (consumed by RoomAssetsProvider on mount) */
  initialAssets: RoomAsset[];
  /** Current tables from appData (updates when async API data arrives) */
  latestTables: Table[];
  /** Current guests from appData (updates when async API data arrives) */
  latestGuests: Guest[];
  /** Current assets from appData (updates when async API data arrives) */
  latestAssets: RoomAsset[];
  /** Current settings slice (consumed by RoomProvider) */
  settings: AppSettings;
  /** Full AppData version string */
  version: string;
  /** Bumps when memory is replaced from storage (cross-tab write, import); SeatingDataProvider re-inits on it. */
  dataVersion: number;

  /**
   * Called by SeatingDataProvider whenever tables or guests change.
   * AppDataProvider merges the slice and schedules a debounced save.
   */
  updateSeatingSlice: (tables: Table[], guests: Guest[]) => void;

  /**
   * Called by RoomAssetsProvider whenever assets change.
   * AppDataProvider merges the slice and schedules a debounced save.
   */
  updateAssetsSlice: (assets: RoomAsset[]) => void;

  /** Called by RoomProvider to change settings; schedules a debounced save. */
  updateSettings: (fn: (settings: AppSettings) => AppSettings) => void;

  /** Flushes pending edits, then serializes the whole project (plus color theme). */
  exportJson: () => string;

  /** Flushes pending edits, imports, and on success reloads memory from storage. */
  importJson: (json: string) => { success: boolean; error?: string };

  /** Drops the pending save. Call before wiping localStorage wholesale. */
  discardPending: () => void;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
