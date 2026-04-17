import type { RoomAssetType } from '@/types/seating';

export interface RoomAssetPreset {
  label: string;
  /** Width in inches (pre-rotation). */
  widthInches: number;
  /** Height in inches (pre-rotation). */
  heightInches: number;
  category: 'Service' | 'Dance Floor' | 'Partitions';
}

export const ROOM_ASSET_CATEGORIES = ['Service', 'Dance Floor', 'Partitions'] as const;

const FT = 12; // inches per foot

export const ROOM_ASSET_PRESETS: Record<RoomAssetType, RoomAssetPreset> = {
  'serving-table': {
    label: 'Serving Table',
    widthInches: 8 * FT,
    heightInches: 2.5 * FT,
    category: 'Service',
  },
  'dj-setup': {
    label: 'DJ Setup',
    widthInches: 8 * FT,
    heightInches: 6 * FT,
    category: 'Service',
  },
  speaker: {
    label: 'Speaker',
    widthInches: 2 * FT,
    heightInches: 2 * FT,
    category: 'Service',
  },
  'dance-floor-medium': {
    label: 'Dance Floor — Medium',
    widthInches: 15 * FT,
    heightInches: 15 * FT,
    category: 'Dance Floor',
  },
  'dance-floor-large': {
    label: 'Dance Floor — Large',
    widthInches: 20 * FT,
    heightInches: 20 * FT,
    category: 'Dance Floor',
  },
  'partition-horizontal': {
    label: 'Horizontal Partition',
    widthInches: 10 * FT,
    heightInches: 1 * FT,
    category: 'Partitions',
  },
  'partition-vertical': {
    label: 'Vertical Partition',
    widthInches: 1 * FT,
    heightInches: 10 * FT,
    category: 'Partitions',
  },
};

export function formatAssetSize(preset: RoomAssetPreset): string {
  const w = preset.widthInches / 12;
  const h = preset.heightInches / 12;
  return `${w} × ${h} ft`;
}
