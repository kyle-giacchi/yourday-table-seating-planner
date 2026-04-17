import { describe, it, expect } from 'vitest';
import { AppDataSchema, RoomAssetSchema } from '@/schemas/appData';

const baseAppData = {
  version: '1.0.0',
  tables: [],
  guests: [],
  settings: {
    roomOutline: {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      realWorldWidth: 10,
      realWorldHeight: 10,
      isVisible: true,
    },
    roomBorder: {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      realWorldWidth: 10,
      realWorldHeight: 10,
      isVisible: false,
    },
    backgroundImage: { backgroundImage: null, imageOpacity: 0.3 },
    isReferenceLocked: false,
  },
};

describe('RoomAssetSchema', () => {
  it('accepts a valid asset', () => {
    const ok = RoomAssetSchema.safeParse({
      id: 'asset-1',
      type: 'dj-setup',
      x: 100,
      y: 200,
      rotation: 45,
    });
    expect(ok.success).toBe(true);
  });

  it('rejects an unknown type', () => {
    const bad = RoomAssetSchema.safeParse({
      id: 'asset-1',
      type: 'not-a-type',
      x: 0,
      y: 0,
      rotation: 0,
    });
    expect(bad.success).toBe(false);
  });

  it('rejects rotation outside 0-360', () => {
    const bad = RoomAssetSchema.safeParse({
      id: 'asset-1',
      type: 'speaker',
      x: 0,
      y: 0,
      rotation: 400,
    });
    expect(bad.success).toBe(false);
  });

  it('rejects negative rotation', () => {
    const bad = RoomAssetSchema.safeParse({
      id: 'asset-1',
      type: 'speaker',
      x: 0,
      y: 0,
      rotation: -1,
    });
    expect(bad.success).toBe(false);
  });

  it('rejects NaN rotation', () => {
    const bad = RoomAssetSchema.safeParse({
      id: 'asset-1',
      type: 'speaker',
      x: 0,
      y: 0,
      rotation: NaN,
    });
    expect(bad.success).toBe(false);
  });
});

describe('AppDataSchema with assets', () => {
  it('defaults assets to [] when missing', () => {
    const result = AppDataSchema.parse(baseAppData);
    expect(result.assets).toEqual([]);
  });

  it('accepts an asset in the assets array', () => {
    const result = AppDataSchema.safeParse({
      ...baseAppData,
      assets: [{ id: 'asset-1', type: 'speaker', x: 10, y: 20, rotation: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed asset inside assets', () => {
    const result = AppDataSchema.safeParse({
      ...baseAppData,
      assets: [{ id: 'asset-1', type: 'wrong-type', x: 10, y: 20, rotation: 0 }],
    });
    expect(result.success).toBe(false);
  });
});
