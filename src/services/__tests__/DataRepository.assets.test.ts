import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository } from '@/services/DataRepository';

describe('LocalStorageRepository — assets backward compatibility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns an empty assets array by default', () => {
    const repo = new LocalStorageRepository();
    const data = repo.loadAppData();
    expect(Array.isArray(data.assets)).toBe(true);
    expect(data.assets).toEqual([]);
  });

  it('normalizes legacy stored data that lacks an assets field', () => {
    const legacy = {
      version: '1.0.0',
      lastModified: Date.now(),
      tables: [],
      guests: [],
      settings: {
        roomOutline: {
          x: 50,
          y: 50,
          width: 300,
          height: 200,
          realWorldWidth: 30,
          realWorldHeight: 20,
          isVisible: true,
        },
        roomBorder: {
          x: 100,
          y: 100,
          width: 400,
          height: 300,
          realWorldWidth: 40,
          realWorldHeight: 30,
          isVisible: false,
        },
        backgroundImage: { backgroundImage: null, imageOpacity: 0.3 },
        isReferenceLocked: false,
      },
      // no `assets` field on purpose
    };
    localStorage.setItem('lovable-seating-app-data', JSON.stringify(legacy));

    const repo = new LocalStorageRepository();
    const data = repo.loadAppData();
    expect(data.assets).toEqual([]);
  });

  it('round-trips an assets array', () => {
    const repo = new LocalStorageRepository();
    const initial = repo.loadAppData();
    const next = {
      ...initial,
      assets: [{ id: 'asset-1', type: 'speaker' as const, x: 100, y: 200, rotation: 0 }],
    };
    repo.saveAppData(next);

    const reloaded = repo.loadAppData();
    expect(reloaded.assets).toHaveLength(1);
    expect(reloaded.assets[0]).toMatchObject({ id: 'asset-1', type: 'speaker' });
  });

  it('normalizes and migrates legacy data with an older version and no assets field', () => {
    // Version '1.1.0' triggers the migration branch (CURRENT_VERSION is '1.2.0').
    // The 1.1.0 -> 1.2.0 migration step does a passthrough, so all fields are preserved.
    // The post-migration normalization block sets assets = [] when the field is absent.
    const legacyOlderVersion = {
      version: '1.1.0',
      lastModified: Date.now(),
      tables: [],
      guests: [],
      settings: {
        roomOutline: {
          x: 50,
          y: 50,
          width: 300,
          height: 200,
          realWorldWidth: 30,
          realWorldHeight: 20,
          isVisible: true,
        },
        roomBorder: {
          x: 100,
          y: 100,
          width: 400,
          height: 300,
          realWorldWidth: 40,
          realWorldHeight: 30,
          isVisible: false,
        },
        backgroundImage: { backgroundImage: null, imageOpacity: 0.3 },
        isReferenceLocked: false,
      },
      // no `assets` field on purpose — exercises the migration-branch normalization
    };
    localStorage.setItem('lovable-seating-app-data', JSON.stringify(legacyOlderVersion));

    const repo = new LocalStorageRepository();
    const data = repo.loadAppData();
    expect(data.assets).toEqual([]);

    // Migration re-persists the upgraded blob — verify the stored JSON includes assets
    const persisted = JSON.parse(localStorage.getItem('lovable-seating-app-data')!);
    expect(persisted.assets).toEqual([]);
  });
});
