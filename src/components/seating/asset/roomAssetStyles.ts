import type { RoomAssetType } from '@/types/seating';

export interface RoomAssetStyle {
  background: string;
  border: string;
  textColor: string;
  shortLabel: string;
}

export const ROOM_ASSET_STYLES: Record<RoomAssetType, RoomAssetStyle> = {
  'serving-table': {
    background: 'bg-amber-100',
    border: 'border-amber-400',
    textColor: 'text-amber-900',
    shortLabel: 'Serving',
  },
  'dj-setup': {
    background: 'bg-slate-900',
    border: 'border-slate-700',
    textColor: 'text-slate-100',
    shortLabel: '',
  },
  speaker: {
    background: 'bg-gray-900',
    border: 'border-gray-700',
    textColor: 'text-gray-100',
    shortLabel: '',
  },
  'partition-horizontal': {
    background: 'bg-slate-300',
    border: 'border-slate-500',
    textColor: 'text-slate-800',
    shortLabel: '',
  },
  'partition-vertical': {
    background: 'bg-slate-300',
    border: 'border-slate-500',
    textColor: 'text-slate-800',
    shortLabel: '',
  },
  'dance-floor-large': {
    background: 'bg-yellow-50',
    border: 'border-yellow-500',
    textColor: 'text-yellow-900',
    shortLabel: '',
  },
  'dance-floor-medium': {
    background: 'bg-yellow-50',
    border: 'border-yellow-500',
    textColor: 'text-yellow-900',
    shortLabel: '',
  },
};
