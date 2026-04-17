import { useEffect, useRef } from 'react';
import type { Table, Guest, SeatingData, RoomAsset } from '@/types/seating';

interface SyncParams {
  seatingData: SeatingData;
  dataVersion: number;
  latestTables: Table[];
  latestGuests: Guest[];
  updateSeatingSlice: (tables: Table[], guests: Guest[]) => void;
  setTableEntities: (tables: Table[]) => void;
  setGuestEntities: (guests: Guest[]) => void;
  assets: RoomAsset[];
  latestAssets: RoomAsset[];
  updateAssetsSlice: (assets: RoomAsset[]) => void;
  setAssetEntities: (assets: RoomAsset[]) => void;
}

export const useSeatingSyncEffects = (params: SyncParams) => {
  const {
    seatingData,
    dataVersion,
    latestTables,
    latestGuests,
    updateSeatingSlice,
    setTableEntities,
    setGuestEntities,
    assets,
    latestAssets,
    updateAssetsSlice,
    setAssetEntities,
  } = params;

  const isFirstRenderSeating = useRef(true);
  const isFirstRenderAssets = useRef(true);
  const prevDataVersion = useRef(dataVersion);

  // Push seating changes up to AppDataProvider; skip first render.
  useEffect(() => {
    if (isFirstRenderSeating.current) {
      isFirstRenderSeating.current = false;
      return;
    }
    updateSeatingSlice(seatingData.tables, seatingData.unassignedGuests);
  }, [seatingData, updateSeatingSlice]);

  // Push asset changes up to AppDataProvider; skip first render.
  useEffect(() => {
    if (isFirstRenderAssets.current) {
      isFirstRenderAssets.current = false;
      return;
    }
    updateAssetsSlice(assets);
  }, [assets, updateAssetsSlice]);

  // Re-init from async API data when dataVersion increments (paid users).
  useEffect(() => {
    if (dataVersion > prevDataVersion.current) {
      prevDataVersion.current = dataVersion;
      setTableEntities(latestTables);
      setGuestEntities(latestGuests);
      setAssetEntities(latestAssets);
      isFirstRenderSeating.current = true;
      isFirstRenderAssets.current = true;
    }
  }, [
    dataVersion,
    latestTables,
    latestGuests,
    latestAssets,
    setTableEntities,
    setGuestEntities,
    setAssetEntities,
  ]);
};
