import type { ReactNode } from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRoomOperations } from '@/hooks/useRoomOperations';
import { useAppData } from '@/contexts/AppDataContext';
import { useUIState } from '@/contexts/UIStateContext';
import type { AppData } from '@/types/appData';
import { RoomContext } from './RoomContext';

interface RoomProviderProps {
  children: ReactNode;
}

export const RoomProvider = ({ children }: RoomProviderProps) => {
  const { settings: initialSettings, updateSettingsSlice, version } = useAppData();
  // C2 fix: Read canvas dimensions from UIStateContext instead of duplicating state.
  const { canvasDimensions } = useUIState();

  // RoomProvider keeps a local AppData-shaped object so useRoomOperations
  // (which expects AppData + setAppData) keeps working unchanged.
  const [appData, setAppData] = useState<AppData>(() => ({
    version,
    lastModified: Date.now(),
    tables: [],
    guests: [],
    assets: [],
    settings: initialSettings,
  }));

  const roomOperations = useRoomOperations(appData, setAppData, canvasDimensions);

  // Push settings changes up to AppDataProvider; skip the initial render.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    updateSettingsSlice(appData.settings);
  }, [appData.settings, updateSettingsSlice]);

  const contextValue = useMemo(
    () => ({
      backgroundImageState: appData.settings.backgroundImage,
      roomOutlineState: appData.settings.roomOutline,
      isReferenceLocked: appData.settings.isReferenceLocked,
      setBackgroundImage: roomOperations.setBackgroundImage,
      setImageOpacity: roomOperations.setImageOpacity,
      updateRoomOutline: roomOperations.updateRoomOutline,
      lockReference: roomOperations.lockReference,
      unlockReference: roomOperations.unlockReference,
      getReferenceScale: roomOperations.getReferenceScale,
      getTableScale: roomOperations.getTableScale,
    }),
    [
      appData.settings.backgroundImage,
      appData.settings.roomOutline,
      appData.settings.isReferenceLocked,
      roomOperations.setBackgroundImage,
      roomOperations.setImageOpacity,
      roomOperations.updateRoomOutline,
      roomOperations.lockReference,
      roomOperations.unlockReference,
      roomOperations.getReferenceScale,
      roomOperations.getTableScale,
    ],
  );

  return <RoomContext.Provider value={contextValue}>{children}</RoomContext.Provider>;
};
