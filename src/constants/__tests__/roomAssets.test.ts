import { describe, it, expect } from 'vitest';
import { ROOM_ASSET_PRESETS, ROOM_ASSET_CATEGORIES, formatAssetSize } from '@/constants/roomAssets';
import type { RoomAssetType } from '@/types/seating';

const ALL_TYPES = Object.keys(ROOM_ASSET_PRESETS) as RoomAssetType[];

describe('ROOM_ASSET_PRESETS', () => {
  it('has a preset entry for every RoomAssetType', () => {
    for (const type of ALL_TYPES) {
      expect(ROOM_ASSET_PRESETS[type]).toBeDefined();
    }
  });

  it('every preset has positive finite dimensions', () => {
    for (const type of ALL_TYPES) {
      const preset = ROOM_ASSET_PRESETS[type];
      expect(Number.isFinite(preset.widthInches)).toBe(true);
      expect(Number.isFinite(preset.heightInches)).toBe(true);
      expect(preset.widthInches).toBeGreaterThan(0);
      expect(preset.heightInches).toBeGreaterThan(0);
    }
  });

  it('every preset has a non-empty label and category', () => {
    for (const type of ALL_TYPES) {
      const preset = ROOM_ASSET_PRESETS[type];
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.category.length).toBeGreaterThan(0);
    }
  });

  it('ROOM_ASSET_CATEGORIES covers every preset category', () => {
    const categoriesInUse = new Set(Object.values(ROOM_ASSET_PRESETS).map((p) => p.category));
    for (const cat of categoriesInUse) {
      expect(ROOM_ASSET_CATEGORIES).toContain(cat);
    }
  });

  it('formatAssetSize returns the correct display string for each preset', () => {
    const expected: Record<RoomAssetType, string> = {
      'serving-table': '8 × 2.5 ft',
      'dj-setup': '8 × 6 ft',
      speaker: '2 × 2 ft',
      'dance-floor-medium': '15 × 15 ft',
      'dance-floor-large': '20 × 20 ft',
      'partition-horizontal': '10 × 1 ft',
      'partition-vertical': '1 × 10 ft',
    };
    for (const type of ALL_TYPES) {
      expect(formatAssetSize(ROOM_ASSET_PRESETS[type])).toBe(expected[type]);
    }
  });
});
