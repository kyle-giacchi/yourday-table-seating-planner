/**
 * Seed helpers for Playwright E2E tests.
 *
 * Builds AppData objects that can be injected into localStorage
 * before the page loads, giving each test deterministic state.
 */

// ---- Types (mirrored from src/types/ to avoid path-alias issues) ----

export interface Guest {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  mealSelection: string;
  party: string;
}

export interface Table {
  id: string;
  x: number;
  y: number;
  shape: 'round' | 'rectangle';
  capacity: number;
  guests: Guest[];
  name: string;
  tableNumber: number;
  tableSize: string;
  commonUse: string;
  defaultChairs: number;
  maxChairs: number;
}

export interface AppSettings {
  roomOutline: RoomRectangle;
  roomBorder: RoomRectangle;
  backgroundImage: {
    backgroundImage: string | null;
    imageOpacity: number;
    imagePosition?: { x: number; y: number };
    imageScale?: number;
  };
  isReferenceLocked: boolean;
}

export interface RoomRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  realWorldWidth: number;
  realWorldHeight: number;
  isVisible: boolean;
}

export interface AppData {
  version: string;
  lastModified: number;
  tables: Table[];
  guests: Guest[];
  settings: AppSettings;
}

// ---- Constants ----

export const STORAGE_KEY = 'lovable-seating-app-data';
export const CURRENT_VERSION = '1.2.0';

const DEFAULT_SETTINGS: AppSettings = {
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
};

const MEALS = ['Chicken', 'Beef', 'Vegetarian', 'Vegan', 'Fish'] as const;
const FIRST_NAMES = [
  'Alice',
  'Bob',
  'Carol',
  'David',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Iris',
  'Jack',
];
const LAST_NAMES = [
  'Johnson',
  'Smith',
  'Wilson',
  'Davis',
  'Brown',
  'Miller',
  'Anderson',
  'Taylor',
  'White',
  'Moore',
];

// ---- Factories ----

let idCounter = 0;

/** Reset the ID counter between tests if needed. */
export function resetIdCounter() {
  idCounter = 0;
}

export function createGuest(overrides: Partial<Guest> = {}): Guest {
  const idx = ++idCounter;
  const first = FIRST_NAMES[idx % FIRST_NAMES.length];
  const last = LAST_NAMES[idx % LAST_NAMES.length];
  return {
    id: `e2e-guest-${idx}`,
    fullName: `${first} ${last}`,
    firstName: first,
    lastName: last,
    mealSelection: MEALS[idx % MEALS.length],
    party: `${last} Family`,
    ...overrides,
  };
}

export function createGuests(count: number, overrides: Partial<Guest> = {}): Guest[] {
  return Array.from({ length: count }, () => createGuest(overrides));
}

export function createTable(overrides: Partial<Table> = {}): Table {
  const idx = ++idCounter;
  return {
    id: `e2e-table-${idx}`,
    x: 150 + idx * 120,
    y: 200,
    shape: 'round',
    capacity: 8,
    guests: [],
    name: `Table ${idx}`,
    tableNumber: idx,
    tableSize: '60" diameter',
    commonUse: 'Standard banquet, weddings',
    defaultChairs: 8,
    maxChairs: 10,
    ...overrides,
  };
}

export function createTables(count: number, overrides: Partial<Table> = {}): Table[] {
  return Array.from({ length: count }, () => createTable(overrides));
}

/** Build a complete AppData payload ready for localStorage injection. */
export function buildAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    version: CURRENT_VERSION,
    lastModified: Date.now(),
    tables: [],
    guests: [],
    settings: DEFAULT_SETTINGS,
    ...overrides,
  };
}

/**
 * Build AppData with pre-assigned guests on tables.
 * Distributes guests evenly across tables.
 */
export function buildSeededAppData(
  opts: {
    guestCount?: number;
    tableCount?: number;
    assignAll?: boolean;
  } = {},
): AppData {
  const { guestCount = 10, tableCount = 2, assignAll = false } = opts;
  resetIdCounter();

  const guests = createGuests(guestCount);
  const tables = createTables(tableCount);

  if (assignAll) {
    const perTable = Math.ceil(guests.length / tables.length);
    tables.forEach((table, i) => {
      table.guests = guests.slice(i * perTable, (i + 1) * perTable);
    });
    return buildAppData({ tables, guests: [] });
  }

  return buildAppData({ tables, guests });
}
