import { createContext, useContext } from 'react';
import type { BackgroundImageState } from '@/types/appData';
import type { RoomRectangle, RoomOutlineState } from '@/types/room';

export interface RoomContextType {
  backgroundImageState: BackgroundImageState;
  roomOutlineState: RoomRectangle;
  isReferenceLocked: boolean;
  setBackgroundImage: (image: string | null) => void;
  setImageOpacity: (opacity: number) => void;
  updateRoomOutline: (updates: Partial<RoomOutlineState>) => void;
  lockReference: () => void;
  unlockReference: () => void;
  getReferenceScale: () => number;
  getTableScale: () => number;
}

export const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};
