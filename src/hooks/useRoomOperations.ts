import { useCallback } from 'react';
import type { RoomOutlineState } from '@/types/room';
import { calculateReferenceScale, migrateToPercentageCoordinates } from '@/utils/roomUtils';
import type { AppSettings } from '@/types/appData';

export const useRoomOperations = (
  settings: AppSettings,
  updateSettings: (fn: (settings: AppSettings) => AppSettings) => void,
  canvasDimensions: { width: number; height: number },
) => {
  const getReferenceScale = useCallback(
    () => calculateReferenceScale(settings.roomOutline, canvasDimensions),
    [settings.roomOutline, canvasDimensions],
  );

  const getTableScale = useCallback(() => {
    try {
      if (!settings.isReferenceLocked) {
        return 1; // Default scale when no reference is locked
      }

      const pixelsPerInch = getReferenceScale();

      // Return pixels per inch directly - this is our consistent scale
      return Math.max(0.1, pixelsPerInch);
    } catch (error) {
      console.error('Error calculating table scale:', error);
      return 1;
    }
  }, [getReferenceScale, settings.isReferenceLocked]);

  const setBackgroundImage = useCallback(
    (image: string | null) => {
      updateSettings((prev) => ({
        ...prev,
        backgroundImage: { ...prev.backgroundImage, backgroundImage: image },
      }));
    },
    [updateSettings],
  );

  const setImageOpacity = useCallback(
    (opacity: number) => {
      updateSettings((prev) => ({
        ...prev,
        backgroundImage: { ...prev.backgroundImage, imageOpacity: opacity },
      }));
    },
    [updateSettings],
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
              { ...settings.roomOutline, ...updates },
              canvasDimensions,
            )
          : updates;

      updateSettings((prev) => ({
        ...prev,
        roomOutline: { ...prev.roomOutline, ...migratedUpdates },
      }));
    },
    [updateSettings, settings.roomOutline, canvasDimensions],
  );

  const lockReference = useCallback(() => {
    if (settings.roomOutline.realWorldWidth <= 0) {
      console.error('Invalid reference dimensions');
      return;
    }

    updateSettings((prev) => ({ ...prev, isReferenceLocked: true }));
  }, [settings.roomOutline, updateSettings]);

  const unlockReference = useCallback(() => {
    updateSettings((prev) => ({ ...prev, isReferenceLocked: false }));
  }, [updateSettings]);

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
