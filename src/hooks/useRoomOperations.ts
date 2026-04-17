import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';
import type { RoomOutlineState } from '@/types/room';
import { calculateReferenceScale, migrateToPercentageCoordinates } from '@/utils/roomUtils';
import type { AppData } from '@/types/appData';

export const useRoomOperations = (
  appData: AppData,
  setAppData: Dispatch<SetStateAction<AppData>>,
  canvasDimensions: { width: number; height: number },
) => {
  const getReferenceScale = useCallback(
    () => calculateReferenceScale(appData.settings.roomOutline, canvasDimensions),
    [appData.settings.roomOutline, canvasDimensions],
  );

  const getTableScale = useCallback(() => {
    try {
      if (!appData.settings.isReferenceLocked) {
        return 1; // Default scale when no reference is locked
      }

      const pixelsPerInch = getReferenceScale();

      // Return pixels per inch directly - this is our consistent scale
      return Math.max(0.1, pixelsPerInch);
    } catch (error) {
      console.error('Error calculating table scale:', error);
      return 1;
    }
  }, [getReferenceScale, appData.settings.isReferenceLocked]);

  const setBackgroundImage = useCallback(
    (image: string | null) => {
      setAppData((prev: AppData) => ({
        ...prev,
        settings: {
          ...prev.settings,
          backgroundImage: { ...prev.settings.backgroundImage, backgroundImage: image },
        },
      }));
    },
    [setAppData],
  );

  const setImageOpacity = useCallback(
    (opacity: number) => {
      setAppData((prev: AppData) => ({
        ...prev,
        settings: {
          ...prev.settings,
          backgroundImage: { ...prev.settings.backgroundImage, imageOpacity: opacity },
        },
      }));
    },
    [setAppData],
  );

  const updateRoomOutline = useCallback(
    (updates: Partial<RoomOutlineState>) => {
      // Ensure we're working with percentage coordinates
      const migratedUpdates =
        updates.x !== undefined ||
        updates.y !== undefined ||
        updates.width !== undefined ||
        updates.height !== undefined
          ? migrateToPercentageCoordinates(
              { ...appData.settings.roomOutline, ...updates },
              canvasDimensions,
            )
          : updates;

      setAppData((prev: AppData) => ({
        ...prev,
        settings: {
          ...prev.settings,
          roomOutline: { ...prev.settings.roomOutline, ...migratedUpdates },
        },
      }));
    },
    [setAppData, appData.settings.roomOutline, canvasDimensions],
  );

  const lockReference = useCallback(() => {
    if (appData.settings.roomOutline.realWorldWidth <= 0) {
      console.error('Invalid reference dimensions');
      return;
    }

    setAppData((prev: AppData) => ({
      ...prev,
      settings: {
        ...prev.settings,
        isReferenceLocked: true,
      },
    }));
  }, [appData.settings.roomOutline, setAppData]);

  const unlockReference = useCallback(() => {
    setAppData((prev: AppData) => ({
      ...prev,
      settings: {
        ...prev.settings,
        isReferenceLocked: false,
      },
    }));
  }, [setAppData]);

  return {
    getReferenceScale,
    getTableScale,
    setBackgroundImage,
    setImageOpacity,
    updateRoomOutline,
    lockReference,
    unlockReference,
  };
};
