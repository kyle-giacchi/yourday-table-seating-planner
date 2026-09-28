export type AllergyFlag =
  'nut' | 'gluten' | 'dairy' | 'shellfish' | 'egg' | 'soy' | 'vegan' | 'kosher' | 'halal';
export type RsvpStatus = 'attending' | 'declined' | 'pending';

export interface Guest {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  mealSelection: string;
  party: string;
  /** Free-text notes shown on the banquet summary next to the meal badge. */
  dietaryNotes?: string;
  /** Structured flags that drive the ALLERGY banner and the summary alert strip. */
  allergyFlags?: AllergyFlag[];
  /** Tracks whether the guest has confirmed, declined, or not yet responded. */
  rsvpStatus?: RsvpStatus;
}

export interface TableSpec {
  shape: 'round' | 'rectangle';
  size: string;
  commonUse: string;
  defaultChairs: number;
  maxChairs: number;
}

export interface Table {
  id: string;
  x: number;
  y: number;
  shape: 'round' | 'rectangle';
  capacity: number;
  guests: Guest[];
  name: string; // Made required
  tableNumber: number; // New required field
  // Existing attributes
  tableSize: string;
  commonUse: string;
  defaultChairs: number;
  maxChairs: number;
  /** When true, the summary highlights this table and sorts it first. */
  isHeadTable?: boolean;
}

export interface SeatingData {
  tables: Table[];
  unassignedGuests: Guest[];
}

export const TABLE_SPECIFICATIONS: TableSpec[] = [
  {
    shape: 'round',
    size: '24" diameter',
    commonUse: 'Cocktail, bistro, sweetheart',
    defaultChairs: 2,
    maxChairs: 3,
  },
  {
    shape: 'round',
    size: '30" diameter',
    commonUse: 'Cocktail, high-top standing',
    defaultChairs: 2,
    maxChairs: 3,
  },
  {
    shape: 'round',
    size: '36" diameter',
    commonUse: 'Small groups, bistro',
    defaultChairs: 3,
    maxChairs: 4,
  },
  {
    shape: 'round',
    size: '48" diameter',
    commonUse: 'Small banquet, meeting',
    defaultChairs: 6,
    maxChairs: 8,
  },
  {
    shape: 'round',
    size: '60" diameter',
    commonUse: 'Standard banquet, weddings',
    defaultChairs: 8,
    maxChairs: 10,
  },
  {
    shape: 'round',
    size: '66" diameter',
    commonUse: 'Larger banquets, more elbow room',
    defaultChairs: 9,
    maxChairs: 11,
  },
  {
    shape: 'round',
    size: '72" diameter',
    commonUse: 'Large events, gala dinners',
    defaultChairs: 10,
    maxChairs: 12,
  },
  {
    shape: 'rectangle',
    size: '48" x 18"',
    commonUse: 'Classroom setups, narrow spaces',
    defaultChairs: 2,
    maxChairs: 4,
  },
  {
    shape: 'rectangle',
    size: '48" x 24"',
    commonUse: "Kids' tables, food service",
    defaultChairs: 4,
    maxChairs: 6,
  },
  {
    shape: 'rectangle',
    size: '60" x 18"',
    commonUse: 'Training, narrow banquet use',
    defaultChairs: 4,
    maxChairs: 6,
  },
  {
    shape: 'rectangle',
    size: '60" x 30"',
    commonUse: 'Buffet, general use',
    defaultChairs: 6,
    maxChairs: 8,
  },
  {
    shape: 'rectangle',
    size: '72" x 18"',
    commonUse: 'Conferences, workshops',
    defaultChairs: 6,
    maxChairs: 8,
  },
  {
    shape: 'rectangle',
    size: '72" x 30"',
    commonUse: 'Most common banquet rectangle',
    defaultChairs: 6,
    maxChairs: 8,
  },
  {
    shape: 'rectangle',
    size: '96" x 30"',
    commonUse: 'Head table, large gatherings',
    defaultChairs: 8,
    maxChairs: 10,
  },
];

// ---------- Room Assets ----------

export type RoomAssetType =
  | 'serving-table'
  | 'dj-setup'
  | 'speaker'
  | 'partition-horizontal'
  | 'partition-vertical'
  | 'dance-floor-large'
  | 'dance-floor-medium';

export interface RoomAsset {
  id: string;
  type: RoomAssetType;
  x: number;
  y: number;
  /** Degrees, 0-360, rotated around the asset's center. */
  rotation: number;
}
