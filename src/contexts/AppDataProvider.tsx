import type { ReactNode } from 'react';
import { useState, useCallback, useMemo, useEffect, useSyncExternalStore } from 'react';
import { STORAGE_KEY } from '@/services/DataRepository';
import { createProjectStore } from '@/services/projectStore';
import type { AppSettings } from '@/types/appData';
import type { Table, Guest, RoomAsset } from '@/types/seating';
import { AppDataContext, type AppDataContextType } from './AppDataContext';

interface AppDataProviderProps {
  children: ReactNode;
}

export const AppDataProvider = ({ children }: AppDataProviderProps) => {
  const [store] = useState(() => createProjectStore());
  const { data: appData, reloads: dataVersion } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
  );

  // Cross-tab writes reload memory (bumping dataVersion so SeatingDataProvider
  // re-inits). Hiding/closing the tab flushes the debounced save.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) store.reload();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') store.flush();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('pagehide', store.flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pagehide', store.flush);
      document.removeEventListener('visibilitychange', onVisibility);
      store.flush();
    };
  }, [store]);

  const updateSeatingSlice = useCallback(
    (tables: Table[], guests: Guest[]) => store.update((d) => ({ ...d, tables, guests })),
    [store],
  );

  const updateAssetsSlice = useCallback(
    (assets: RoomAsset[]) => store.update((d) => ({ ...d, assets })),
    [store],
  );

  const updateSettings = useCallback(
    (fn: (settings: AppSettings) => AppSettings) =>
      store.update((d) => ({ ...d, settings: fn(d.settings) })),
    [store],
  );

  const [initialTables] = useState(() => appData.tables);
  const [initialGuests] = useState(() => appData.guests);
  const [initialAssets] = useState(() => appData.assets);

  const contextValue = useMemo<AppDataContextType>(
    () => ({
      initialTables,
      initialGuests,
      initialAssets,
      latestTables: appData.tables,
      latestGuests: appData.guests,
      latestAssets: appData.assets,
      settings: appData.settings,
      version: appData.version,
      dataVersion,
      updateSeatingSlice,
      updateAssetsSlice,
      updateSettings,
      exportJson: store.exportJson,
      importJson: store.importJson,
      discardPending: store.discard,
    }),
    [
      initialTables,
      initialGuests,
      initialAssets,
      appData.tables,
      appData.guests,
      appData.assets,
      appData.settings,
      appData.version,
      dataVersion,
      updateSeatingSlice,
      updateAssetsSlice,
      updateSettings,
      store,
    ],
  );

  return <AppDataContext.Provider value={contextValue}>{children}</AppDataContext.Provider>;
};
