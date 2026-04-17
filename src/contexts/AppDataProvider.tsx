import type { ReactNode } from 'react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { defaultRepository, STORAGE_KEY } from '@/services/DataRepository';
import type { AppData, AppSettings } from '@/types/appData';
import type { Table, Guest, RoomAsset } from '@/types/seating';
import { AppDataContext, type AppDataContextType } from './AppDataContext';

interface AppDataProviderProps {
  children: ReactNode;
}

export const AppDataProvider = ({ children }: AppDataProviderProps) => {
  const [appData, setAppData] = useState<AppData>(() => defaultRepository.loadAppData());
  const [dataVersion, setDataVersion] = useState(0);
  const hasPendingChange = useRef(false);

  const updateSeatingSlice = useCallback((tables: Table[], guests: Guest[]) => {
    setAppData((prev) => ({ ...prev, tables, guests }));
    hasPendingChange.current = true;
  }, []);

  const updateAssetsSlice = useCallback((assets: RoomAsset[]) => {
    setAppData((prev) => ({ ...prev, assets }));
    hasPendingChange.current = true;
  }, []);

  const updateSettingsSlice = useCallback((settings: AppSettings) => {
    setAppData((prev) => ({ ...prev, settings }));
    hasPendingChange.current = true;
  }, []);

  // Debounced persistence to localStorage.
  useEffect(() => {
    if (!hasPendingChange.current) return;
    const timer = setTimeout(() => {
      defaultRepository.saveAppData(appData);
    }, 300);
    return () => clearTimeout(timer);
  }, [appData]);

  // Reload from localStorage when another tab writes to the same key. Bumps
  // dataVersion so SeatingDataProvider re-inits from the fresh snapshot.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue === null) return;
      const fresh = defaultRepository.loadAppData();
      setAppData(fresh);
      hasPendingChange.current = false;
      setDataVersion((v) => v + 1);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
      updateSettingsSlice,
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
      updateSettingsSlice,
    ],
  );

  return <AppDataContext.Provider value={contextValue}>{children}</AppDataContext.Provider>;
};
