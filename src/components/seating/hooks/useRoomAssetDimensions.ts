import { useMemo } from 'react';
import type { RoomAssetType } from '@/types/seating';
import { ROOM_ASSET_PRESETS } from '@/constants/roomAssets';

interface UseRoomAssetDimensionsProps {
  type: RoomAssetType;
  getTableScale: () => number;
}

export interface RoomAssetDimensions {
  width: number;
  height: number;
}

export const useRoomAssetDimensions = ({
  type,
  getTableScale,
}: UseRoomAssetDimensionsProps): RoomAssetDimensions => {
  return useMemo(() => {
    const preset = ROOM_ASSET_PRESETS[type];
    const scale = getTableScale();
    const validScale = typeof scale === 'number' && scale > 0 ? scale : 1;
    return {
      width: preset.widthInches * validScale,
      height: preset.heightInches * validScale,
    };
  }, [type, getTableScale]);
};
