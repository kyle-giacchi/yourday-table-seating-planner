import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository } from '@/services/DataRepository';
import type { ColorTheme } from '@/types/appData';
import { CURRENT_VERSION } from '@/utils/migrations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_THEME: ColorTheme = {
  name: 'Ocean Blue',
  value: '221 83% 41%',
  rgb: '30, 64, 175',
  description: 'A cool ocean blue theme',
  secondary: '197 71% 52%',
  secondaryRgb: '55, 163, 196',
};

/** Minimal AppData that passes all validators */
const VALID_APP_DATA = {
  version: CURRENT_VERSION,
  lastModified: Date.now(),
  tables: [],
  guests: [{ id: 'g1', fullName: 'Alice Test', mealSelection: 'Chicken', party: 'Test Party' }],
  assets: [],
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
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageRepository();
  });

  // -------------------------------------------------------------------
  // loadAppData
  // -------------------------------------------------------------------

  describe('loadAppData', () => {
    it('returns default data when localStorage is empty', () => {
      const data = repo.loadAppData();
      // First-time users start with empty state; demo data is opt-in via Index CTA
      expect(data.tables).toEqual([]);
      expect(data.guests).toEqual([]);
      expect(data.version).toBe(CURRENT_VERSION);
    });

    it('loads valid stored data', () => {
      localStorage.setItem('lovable-seating-app-data', JSON.stringify(VALID_APP_DATA));
      const data = repo.loadAppData();
      expect(data.version).toBe(CURRENT_VERSION);
      expect(data.guests).toHaveLength(1);
      expect(data.guests[0].fullName).toBe('Alice Test');
    });

    it('returns defaults when stored data is invalid JSON', () => {
      localStorage.setItem('lovable-seating-app-data', 'this is not json {{{');
      const data = repo.loadAppData();
      // Should fall back to empty defaults
      expect(data.guests).toEqual([]);
      expect(data.tables).toEqual([]);
    });

    it('returns defaults when stored value is completely empty', () => {
      // Ensure nothing was set
      localStorage.removeItem('lovable-seating-app-data');
      const data = repo.loadAppData();
      expect(data.version).toBe(CURRENT_VERSION);
      expect(Array.isArray(data.tables)).toBe(true);
      expect(Array.isArray(data.guests)).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // saveAppData
  // -------------------------------------------------------------------

  describe('saveAppData', () => {
    it('saves valid data to localStorage', () => {
      repo.saveAppData(VALID_APP_DATA as any);
      const stored = localStorage.getItem('lovable-seating-app-data');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.guests[0].fullName).toBe('Alice Test');
    });

    it('updates lastModified when saving', () => {
      const before = Date.now();
      repo.saveAppData(VALID_APP_DATA as any);
      const stored = JSON.parse(localStorage.getItem('lovable-seating-app-data')!);
      expect(stored.lastModified).toBeGreaterThanOrEqual(before);
    });

    it('does not save when data is invalid (null)', () => {
      // @ts-expect-error — deliberately passing null to test rejection
      repo.saveAppData(null);
      // Nothing should have been written
      expect(localStorage.getItem('lovable-seating-app-data')).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // loadTheme / saveTheme
  // -------------------------------------------------------------------

  describe('loadTheme / saveTheme', () => {
    it('returns null when no theme is stored', () => {
      expect(repo.loadTheme()).toBeNull();
    });

    it('round-trips a valid theme', () => {
      repo.saveTheme(VALID_THEME);
      const loaded = repo.loadTheme();
      expect(loaded).not.toBeNull();
      expect(loaded!.name).toBe('Ocean Blue');
      expect(loaded!.value).toBe('221 83% 41%');
    });

    it('does not save an invalid theme (missing fields)', () => {
      const badTheme = { name: 'Bad', value: 'not-hsl' } as any;
      repo.saveTheme(badTheme);
      expect(repo.loadTheme()).toBeNull();
    });

    it('clears invalid stored theme data and returns null', () => {
      // Manually store something invalid
      localStorage.setItem('selected-color-theme', JSON.stringify({ broken: true }));
      const result = repo.loadTheme();
      expect(result).toBeNull();
      // The invalid entry should have been cleaned up
      expect(localStorage.getItem('selected-color-theme')).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // loadMealOptions / saveMealOptions
  // -------------------------------------------------------------------

  describe('loadMealOptions / saveMealOptions', () => {
    it('returns null when no meal options are stored', () => {
      expect(repo.loadMealOptions()).toBeNull();
    });

    it('round-trips a valid meal options array', () => {
      const options = [
        { value: 'Chicken', label: 'Chicken' },
        { value: 'Beef', label: 'Beef' },
      ];
      repo.saveMealOptions(options);
      const loaded = repo.loadMealOptions();
      expect(loaded).not.toBeNull();
      expect(loaded).toHaveLength(2);
      expect(loaded![0].value).toBe('Chicken');
    });

    it('returns null when stored data is an empty array', () => {
      repo.saveMealOptions([]);
      expect(repo.loadMealOptions()).toBeNull();
    });

    it('filters out items missing value or label', () => {
      // Manually write malformed data
      localStorage.setItem(
        'meal-options',
        JSON.stringify([
          { value: 'Good', label: 'Good' },
          { label: 'No Value' }, // missing value
          { value: 'NoLabel' }, // missing label
        ]),
      );
      const loaded = repo.loadMealOptions();
      expect(loaded).toHaveLength(1);
      expect(loaded![0].value).toBe('Good');
    });

    it('returns null when stored data is invalid JSON', () => {
      localStorage.setItem('meal-options', 'INVALID');
      expect(repo.loadMealOptions()).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // exportConfiguration / importConfiguration
  // -------------------------------------------------------------------

  describe('exportConfiguration / importConfiguration', () => {
    it('exportConfiguration returns a JSON string', () => {
      const json = repo.exportConfiguration();
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('tables');
      expect(parsed).toHaveProperty('guests');
    });

    it('exportConfiguration includes exportDate', () => {
      const json = repo.exportConfiguration();
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('exportDate');
    });

    it('round-trips a valid configuration', () => {
      // Save known data first
      repo.saveAppData(VALID_APP_DATA as any);
      const exported = repo.exportConfiguration();

      // Clear storage and re-import
      localStorage.clear();
      const result = repo.importConfiguration(exported);
      expect(result.success).toBe(true);

      // Data should be restored
      const loaded = repo.loadAppData();
      expect(loaded.guests[0].fullName).toBe('Alice Test');
    });

    it('importConfiguration returns error on invalid JSON', () => {
      const result = repo.importConfiguration('not json at all');
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('importConfiguration returns error when required fields are missing', () => {
      const incomplete = JSON.stringify({ version: CURRENT_VERSION });
      const result = repo.importConfiguration(incomplete);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid configuration/);
    });

    it('importConfiguration migrates a 1.0.0 export whose tables lack tableNumber', () => {
      const legacy = {
        ...VALID_APP_DATA,
        version: '1.0.0',
        tables: [
          {
            id: 't1',
            x: 0,
            y: 0,
            shape: 'round',
            capacity: 8,
            tableSize: '60" diameter',
            commonUse: 'Banquet',
            defaultChairs: 8,
            maxChairs: 10,
            guests: [],
          },
        ],
      };
      const result = repo.importConfiguration(JSON.stringify(legacy));
      expect(result.success).toBe(true);
      const loaded = repo.loadAppData();
      expect(loaded.version).toBe(CURRENT_VERSION);
      expect(loaded.tables[0]).toMatchObject({ tableNumber: 1, name: 'Table 1' });
    });

    it('importConfiguration rejects an unknown version', () => {
      const result = repo.importConfiguration(
        JSON.stringify({ ...VALID_APP_DATA, version: '9.9.9' }),
      );
      expect(result.success).toBe(false);
    });

    it('importConfiguration saves colorTheme if present and valid', () => {
      const configWithTheme = {
        ...VALID_APP_DATA,
        colorTheme: VALID_THEME,
        exportDate: new Date().toISOString(),
      };
      const result = repo.importConfiguration(JSON.stringify(configWithTheme));
      expect(result.success).toBe(true);
      const loaded = repo.loadTheme();
      expect(loaded).not.toBeNull();
      expect(loaded!.name).toBe('Ocean Blue');
    });

    // --- A7: sanitize imported strings ---

    it('importConfiguration strips HTML/script content from guest and table names', () => {
      const configWithXss = {
        ...VALID_APP_DATA,
        guests: [
          {
            id: 'g1',
            fullName: '<img src=x onerror="alert(1)">',
            firstName: '<script>',
            lastName: 'Smith',
            party: '<b>Party</b>',
            mealSelection: 'Chicken',
          },
        ],
        tables: [
          {
            id: 't1',
            x: 0,
            y: 0,
            shape: 'round',
            capacity: 8,
            name: 'Table 1',
            tableNumber: 1,
            tableSize: '60" diameter',
            commonUse: 'Banquet',
            defaultChairs: 8,
            maxChairs: 10,
            guests: [
              {
                id: 'g2',
                fullName: '<script>evil()</script>',
                firstName: '<script>',
                lastName: 'Jones',
                party: 'Jones',
                mealSelection: 'Beef',
              },
            ],
          },
        ],
      };

      const result = repo.importConfiguration(JSON.stringify(configWithXss));
      expect(result.success).toBe(true);

      const loaded = repo.loadAppData();
      // sanitizeInput strips < > " etc. No angle brackets should remain anywhere.
      expect(loaded.guests[0].fullName).not.toMatch(/[<>]/);
      expect(loaded.guests[0].firstName).not.toMatch(/[<>]/);
      expect(loaded.guests[0].party).not.toMatch(/[<>]/);
      expect(loaded.tables[0].guests[0].fullName).not.toMatch(/[<>]/);
    });
  });

  // ---------------------------------------------------------------------------
  // A5: Per-slice validation on load
  // ---------------------------------------------------------------------------

  describe('loadAppData per-slice validation', () => {
    const STORAGE_KEY = 'lovable-seating-app-data';

    it('resets only the tables slice when it is corrupt, keeping guests intact', () => {
      const seeded = {
        ...VALID_APP_DATA,
        tables: 'not an array' as unknown,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

      const loaded = repo.loadAppData();
      expect(Array.isArray(loaded.tables)).toBe(true);
      expect(loaded.tables).toHaveLength(0);
      // Guests survived the selective reset
      expect(loaded.guests).toHaveLength(1);
      expect(loaded.guests[0].fullName).toBe('Alice Test');
    });

    it('resets only the guests slice when it is corrupt, keeping tables intact', () => {
      const seeded = {
        ...VALID_APP_DATA,
        tables: [
          {
            id: 't1',
            x: 0,
            y: 0,
            shape: 'round',
            capacity: 8,
            name: 'Table 1',
            tableNumber: 1,
            tableSize: '60" diameter',
            commonUse: 'Banquet',
            defaultChairs: 8,
            maxChairs: 10,
            guests: [],
          },
        ],
        guests: { notAnArray: true } as unknown,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

      const loaded = repo.loadAppData();
      expect(Array.isArray(loaded.guests)).toBe(true);
      expect(loaded.guests).toHaveLength(0);
      expect(loaded.tables).toHaveLength(1);
      expect(loaded.tables[0].id).toBe('t1');
    });

    it('resets the assets slice when corrupt, keeping everything else', () => {
      const seeded = {
        ...VALID_APP_DATA,
        assets: [{ id: 'a1', type: 'not-a-real-type', x: 0, y: 0, rotation: 0 }],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

      const loaded = repo.loadAppData();
      expect(loaded.assets).toHaveLength(0);
      expect(loaded.guests).toHaveLength(1);
    });
  });
});
