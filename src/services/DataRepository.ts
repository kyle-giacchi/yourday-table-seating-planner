import {
  validateStorageData,
  safeJSONParse,
  validateColorTheme,
  validateAppSettings,
  sanitizeGuestData,
} from '@/lib/security';
import { safeLocalStorage } from '@/lib/safeStorage';
import type { AppData, ColorTheme } from '@/types/appData';
import type { Guest, Table } from '@/types/seating';
import { CURRENT_VERSION, migrateData } from '@/utils/migrations';
import { ConfigImportSchema, GuestSchema, TableSchema, RoomAssetSchema } from '@/schemas/appData';
import { APP_DATA_KEY, COLOR_THEME_KEY, MEAL_OPTIONS_KEY } from '@/lib/storageKeys';

// Re-export MealOptionItem so contexts can import it from here
export interface MealOptionItem {
  value: string;
  label: string;
}

// --- Repository Interface ---

export interface DataRepository {
  // App data (tables, guests, settings)
  loadAppData(): AppData;
  saveAppData(data: AppData): void;

  // Color theme
  loadTheme(): ColorTheme | null;
  saveTheme(theme: ColorTheme): void;

  // Meal options
  loadMealOptions(): MealOptionItem[] | null;
  saveMealOptions(options: MealOptionItem[]): void;

  // Config import/export (serialized JSON strings)
  exportConfiguration(): string;
  importConfiguration(jsonString: string): { success: boolean; error?: string };
}

// --- Constants ---

// Re-exported under the legacy `STORAGE_KEY` alias for existing consumers/tests.
export { APP_DATA_KEY as STORAGE_KEY, COLOR_THEME_KEY, MEAL_OPTIONS_KEY } from '@/lib/storageKeys';

const STORAGE_KEY = APP_DATA_KEY;

export const DEFAULT_MEAL_OPTIONS: MealOptionItem[] = [
  { value: 'No Meal Selected', label: 'No Meal Selected' },
  { value: 'Chicken', label: 'Chicken' },
  { value: 'Beef', label: 'Beef' },
  { value: 'Vegetarian', label: 'Vegetarian' },
  { value: 'Vegan', label: 'Vegan' },
  { value: 'Fish', label: 'Fish' },
];

/**
 * Opt-in demo guest list, loaded only when the user clicks
 * "Try it with Demo Data!" on the Index page. First-time users
 * otherwise start with an empty guest list.
 */
export const DEMO_GUESTS: Guest[] = [
  { id: '1', fullName: 'Alice Johnson', mealSelection: 'Chicken', party: 'Johnson Family' },
  { id: '2', fullName: 'Bob Johnson', mealSelection: 'Beef', party: 'Johnson Family' },
  { id: '3', fullName: 'Carol Johnson', mealSelection: 'Vegetarian', party: 'Johnson Family' },
  { id: '4', fullName: 'David Smith', mealSelection: 'Fish', party: 'Smith Family' },
  { id: '5', fullName: 'Eve Smith', mealSelection: 'Vegan', party: 'Smith Family' },
  { id: '6', fullName: 'Frank Smith', mealSelection: 'Chicken', party: 'Smith Family' },
  { id: '7', fullName: 'Grace Wilson', mealSelection: 'Beef', party: 'Wilson Family' },
  { id: '8', fullName: 'Henry Davis', mealSelection: 'Vegetarian', party: 'Davis Family' },
  { id: '9', fullName: 'Iris Brown', mealSelection: 'Fish', party: 'Brown Family' },
  { id: '10', fullName: 'Jack Miller', mealSelection: 'Vegan', party: 'Miller Family' },
  { id: '11', fullName: 'Kate Anderson', mealSelection: 'Chicken', party: 'Anderson Family' },
  { id: '12', fullName: 'Luke Anderson', mealSelection: 'Beef', party: 'Anderson Family' },
  { id: '13', fullName: 'Mary Taylor', mealSelection: 'Vegetarian', party: 'Taylor Family' },
  { id: '14', fullName: 'Nick Taylor', mealSelection: 'Fish', party: 'Taylor Family' },
  { id: '15', fullName: 'Olivia White', mealSelection: 'Vegan', party: 'White Family' },
  { id: '16', fullName: 'Paul White', mealSelection: 'Chicken', party: 'White Family' },
  { id: '17', fullName: 'Quinn Moore', mealSelection: 'Beef', party: 'Moore Family' },
  { id: '18', fullName: 'Ruby Moore', mealSelection: 'Vegetarian', party: 'Moore Family' },
  { id: '19', fullName: 'Sam Clark', mealSelection: 'Fish', party: 'Clark Family' },
  { id: '20', fullName: 'Tina Clark', mealSelection: 'Vegan', party: 'Clark Family' },
  { id: '21', fullName: 'Uma Lewis', mealSelection: 'Chicken', party: 'Lewis Family' },
  { id: '22', fullName: 'Victor Lewis', mealSelection: 'Beef', party: 'Lewis Family' },
  { id: '23', fullName: 'Wendy Hall', mealSelection: 'Vegetarian', party: 'Hall Family' },
  { id: '24', fullName: 'Xavier Hall', mealSelection: 'Fish', party: 'Hall Family' },
  { id: '25', fullName: 'Yara Young', mealSelection: 'Vegan', party: 'Young Family' },
  { id: '26', fullName: 'Zach Young', mealSelection: 'Chicken', party: 'Young Family' },
  { id: '27', fullName: 'Amy King', mealSelection: 'Beef', party: 'King Family' },
  { id: '28', fullName: 'Ben King', mealSelection: 'Vegetarian', party: 'King Family' },
];

/** IDs of guests pre-assigned to demo tables (not in the unassigned list) */
const ASSIGNED_DEMO_IDS = new Set([
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8', // Table 1 (8 guests)
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17', // Table 2 (8 guests)
  '18',
  '19',
  '20',
  '21', // Table 3 (4 guests)
  '22',
  '23',
  '24', // Table 4 (3 guests)
]);

/** Unassigned demo guests — everyone not seated at a table */
export const DEMO_UNASSIGNED_GUESTS: Guest[] = DEMO_GUESTS.filter(
  (g) => !ASSIGNED_DEMO_IDS.has(g.id),
);

const demoGuest = (id: string): Guest => DEMO_GUESTS.find((g) => g.id === id)!;

/**
 * Four pre-built demo tables:
 * - Table 1: full at max capacity (8/8)
 * - Table 2: full at default capacity (8/8)
 * - Table 3: partially filled (4/8)
 * - Table 4: partially filled (3/6)
 */
export const DEMO_TABLES: Table[] = [
  {
    id: 'demo-table-1',
    x: 120,
    y: 100,
    shape: 'round',
    capacity: 8,
    name: 'Head Table',
    tableNumber: 1,
    tableSize: '48" diameter',
    commonUse: 'Small banquet, meeting',
    defaultChairs: 6,
    maxChairs: 8,
    guests: ['1', '2', '3', '4', '5', '6', '7', '8'].map(demoGuest),
  },
  {
    id: 'demo-table-2',
    x: 280,
    y: 100,
    shape: 'round',
    capacity: 10,
    name: 'Family Table',
    tableNumber: 2,
    tableSize: '60" diameter',
    commonUse: 'Standard banquet, weddings',
    defaultChairs: 8,
    maxChairs: 10,
    guests: ['10', '11', '12', '13', '14', '15', '16', '17'].map(demoGuest),
  },
  {
    id: 'demo-table-3',
    x: 120,
    y: 220,
    shape: 'round',
    capacity: 10,
    name: 'Friends Table',
    tableNumber: 3,
    tableSize: '60" diameter',
    commonUse: 'Standard banquet, weddings',
    defaultChairs: 8,
    maxChairs: 10,
    guests: ['18', '19', '20', '21'].map(demoGuest),
  },
  {
    id: 'demo-table-4',
    x: 280,
    y: 220,
    shape: 'round',
    capacity: 8,
    name: 'Colleagues Table',
    tableNumber: 4,
    tableSize: '48" diameter',
    commonUse: 'Small banquet, meeting',
    defaultChairs: 6,
    maxChairs: 8,
    guests: ['22', '23', '24'].map(demoGuest),
  },
];

const DEFAULT_DATA: AppData = {
  version: CURRENT_VERSION,
  lastModified: Date.now(),
  tables: [],
  guests: [],
  assets: [],
  settings: {
    roomOutline: {
      x: 25,
      y: 20,
      width: 50,
      height: 50,
      realWorldWidth: 20,
      realWorldHeight: 20,
      isVisible: true,
    },
    roomBorder: {
      x: 20,
      y: 15,
      width: 60,
      height: 60,
      realWorldWidth: 20,
      realWorldHeight: 20,
      isVisible: false,
    },
    backgroundImage: {
      backgroundImage: null,
      imageOpacity: 0.3,
    },
    isReferenceLocked: false,
  },
};

/**
 * Validate each slice of an AppData payload individually. Corrupt slices are
 * replaced with an empty array (or defaults for settings) so that unrelated
 * data isn't wiped by a single bad entry. Logs to console so we can spot
 * migrations / corruption in the wild.
 */
const validateAppDataSlices = (data: AppData): AppData => {
  const tableCheck = TableSchema.array().safeParse(data.tables);
  const guestCheck = GuestSchema.array().safeParse(data.guests);
  const assetCheck = RoomAssetSchema.array().safeParse(data.assets ?? []);

  const result: AppData = { ...data };

  if (!tableCheck.success) {
    console.error(
      'Invalid tables slice in storage — resetting tables:',
      tableCheck.error.issues[0],
    );
    result.tables = [];
  }
  if (!guestCheck.success) {
    console.error(
      'Invalid guests slice in storage — resetting guests:',
      guestCheck.error.issues[0],
    );
    result.guests = [];
  }
  if (!assetCheck.success) {
    console.error(
      'Invalid assets slice in storage — resetting assets:',
      assetCheck.error.issues[0],
    );
    result.assets = [];
  }

  return result;
};

// --- localStorage Implementation ---

export class LocalStorageRepository implements DataRepository {
  // -- App Data --

  loadAppData(): AppData {
    try {
      const stored = safeLocalStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_DATA;

      const data = safeJSONParse<AppData>(stored);

      if (!data) {
        console.error('Failed to parse stored app data -- returning defaults');
        return DEFAULT_DATA;
      }

      if (!validateStorageData(data)) {
        return DEFAULT_DATA;
      }

      // Run incremental migrations if the version is not current
      if (data.version !== CURRENT_VERSION) {
        const migrated = migrateData(data);

        if (!migrated) {
          // Unknown version with no migration path -- fall back to defaults
          return DEFAULT_DATA;
        }

        // Validate settings after migration; fall back to default settings only
        // (preserving migrated tables and guests) if validation fails
        if (migrated.settings && !validateAppSettings(migrated.settings)) {
          migrated.settings = DEFAULT_DATA.settings;
        }

        if (!Array.isArray(migrated.assets)) {
          migrated.assets = [];
        }

        const validated = validateAppDataSlices(migrated);
        // Persist migrated data so we don't re-run migrations on every load
        this.saveAppData(validated);
        return validated;
      }

      if (data.settings && !validateAppSettings(data.settings)) {
        data.settings = DEFAULT_DATA.settings;
      }

      // Normalize legacy saves that predate Room Assets
      if (!Array.isArray(data.assets)) {
        data.assets = [];
      }

      return validateAppDataSlices(data);
    } catch (error) {
      console.error('Failed to load app data:', error);
      return DEFAULT_DATA;
    }
  }

  saveAppData(data: AppData): void {
    try {
      if (!validateStorageData(data)) {
        console.error('Data validation failed, cannot save');
        return;
      }

      const dataToSave = {
        ...data,
        lastModified: Date.now(),
      };

      const success = safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      if (!success) {
        console.error('Failed to save app data');
      }
    } catch (error) {
      // Save failure (quota, serialization, etc.) — surfaced to console.
      // localStorage is a best-effort cache; data remains in memory and the
      // user can retry on the next interaction that triggers a save.
      console.error('Failed to save app data:', error);
    }
  }

  // -- Color Theme --

  loadTheme(): ColorTheme | null {
    try {
      const saved = safeLocalStorage.getItem(COLOR_THEME_KEY);
      if (!saved) return null;

      const parsed = safeJSONParse<ColorTheme>(saved);
      if (parsed !== null && validateColorTheme(parsed)) {
        return parsed;
      }

      // Invalid theme data -- clean up
      if (parsed !== null) {
        safeLocalStorage.removeItem(COLOR_THEME_KEY);
      }
      return null;
    } catch {
      return null;
    }
  }

  saveTheme(theme: ColorTheme): void {
    try {
      if (!validateColorTheme(theme)) {
        return;
      }
      safeLocalStorage.setItem(COLOR_THEME_KEY, JSON.stringify(theme));
    } catch {
      // Non-critical -- ignore
    }
  }

  // -- Meal Options --

  loadMealOptions(): MealOptionItem[] | null {
    const saved = safeLocalStorage.getItem(MEAL_OPTIONS_KEY);
    if (!saved) return null;

    try {
      const parsed = safeJSONParse<MealOptionItem[]>(saved);
      if (!parsed || !Array.isArray(parsed)) return null;

      const validSaved = parsed.filter(
        (item) => item && typeof item.value === 'string' && typeof item.label === 'string',
      );

      if (validSaved.length === 0) return null;
      return validSaved;
    } catch {
      return null;
    }
  }

  saveMealOptions(options: MealOptionItem[]): void {
    safeLocalStorage.setItem(MEAL_OPTIONS_KEY, JSON.stringify(options));
  }

  // -- Config Import/Export --

  exportConfiguration(): string {
    const appData = this.loadAppData();

    let colorTheme: ColorTheme | null = null;
    try {
      colorTheme = this.loadTheme();
    } catch {
      // Non-critical
    }

    const completeConfig = {
      ...appData,
      colorTheme,
      exportDate: new Date().toISOString(),
      lastModified: Date.now(),
    };

    return JSON.stringify(completeConfig, null, 2);
  }

  importConfiguration(jsonString: string): { success: boolean; error?: string } {
    try {
      const raw = safeJSONParse<unknown>(jsonString);
      if (!raw) {
        return { success: false, error: 'Failed to parse configuration file' };
      }

      const parsed = ConfigImportSchema.safeParse(raw);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        const path = first?.path.join('.') || 'root';
        return {
          success: false,
          error: `Invalid configuration file structure (${path}: ${first?.message ?? 'unknown'})`,
        };
      }

      const { colorTheme, exportDate: _exportDate, ...appData } = parsed.data;

      if (!validateStorageData(appData)) {
        return { success: false, error: 'Configuration data failed validation' };
      }

      if (!validateAppSettings(appData.settings)) {
        return {
          success: false,
          error: 'Configuration settings failed validation (invalid room or background data)',
        };
      }

      // Sanitize user-controlled strings on every guest/table in the import
      // so XSS payloads in exported JSON can't round-trip back into the app.
      const sanitizedGuests = (appData.guests ?? []).map((g) => {
        const cleaned = sanitizeGuestData({
          firstName: g.firstName,
          lastName: g.lastName,
          fullName: g.fullName,
          party: g.party,
          mealSelection: g.mealSelection,
        });
        return {
          ...g,
          firstName: cleaned.firstName ?? g.firstName,
          lastName: cleaned.lastName ?? g.lastName,
          fullName: cleaned.fullName ?? g.fullName,
          party: cleaned.party ?? g.party,
          mealSelection: cleaned.mealSelection ?? g.mealSelection,
        };
      });
      const sanitizedTables = (appData.tables ?? []).map((t) => ({
        ...t,
        guests: (t.guests ?? []).map((g) => {
          const cleaned = sanitizeGuestData({
            firstName: g.firstName,
            lastName: g.lastName,
            fullName: g.fullName,
            party: g.party,
            mealSelection: g.mealSelection,
          });
          return {
            ...g,
            firstName: cleaned.firstName ?? g.firstName,
            lastName: cleaned.lastName ?? g.lastName,
            fullName: cleaned.fullName ?? g.fullName,
            party: cleaned.party ?? g.party,
            mealSelection: cleaned.mealSelection ?? g.mealSelection,
          };
        }),
      }));
      const cleanedAppData = {
        ...appData,
        guests: sanitizedGuests,
        tables: sanitizedTables,
      };

      this.saveAppData(cleanedAppData as AppData);

      if (colorTheme && validateColorTheme(colorTheme)) {
        this.saveTheme(colorTheme as ColorTheme);
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Failed to parse configuration file' };
    }
  }
}

// Singleton default instance for backward compatibility
export const defaultRepository = new LocalStorageRepository();
