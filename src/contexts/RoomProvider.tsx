import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useRoomOperations } from '@/hooks/useRoomOperations';
import { useAppData } from '@/contexts/AppDataContext';
import { useUIState } from '@/contexts/UIStateContext';
import { RoomContext } from './RoomContext';

interface RoomProviderProps {
  children: ReactNode;
}

export const RoomProvider = ({ children }: RoomProviderProps) => {
  const { settings, updateSettings } = useAppData();
  // C2 fix: Read canvas dimensions from UIStateContext instead of duplicating state.
  const { canvasDimensions } = useUIState();

  const roomOperations = useRoomOperations(settings, updateSettings, canvasDimensions);

  const contextValue = useMemo(
    () => ({
      backgroundImageState: settings.backgroundImage,
      roomOutlineState: settings.roomOutline,
      isReferenceLocked: settings.isReferenceLocked,
      setBackgroundImage: roomOperations.setBackgroundImage,
      setImageOpacity: roomOperations.setImageOpacity,
      updateRoomOutline: roomOperations.updateRoomOutline,
      lockReference: roomOperations.lockReference,
      unlockReference: roomOperations.unlockReference,
      getReferenceScale: roomOperations.getReferenceScale,
      getTableScale: roomOperations.getTableScale,
    }),
    [
      settings.backgroundImage,
      settings.roomOutline,
      settings.isReferenceLocked,
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
