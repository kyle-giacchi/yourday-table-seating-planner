/**
 * Zod schemas for frontend data validation.
 *
 * These complement the hand-rolled sanitisation pipeline in
 * `src/lib/security.ts` (which still owns string cleansing / escaping).
 * Use these when you need a structural gate — most importantly at
 * user-provided input boundaries like config imports or CSV uploads.
 */
import { z } from 'zod';

const MAX_TABLES = 500;
const MAX_GUESTS = 5000;
const MAX_ASSETS = 200;

export const RoomAssetTypeSchema = z.enum([
  'serving-table',
  'dj-setup',
  'speaker',
  'partition-horizontal',
  'partition-vertical',
  'dance-floor-large',
  'dance-floor-medium',
]);

export const RoomAssetSchema = z
  .object({
    id: z.string().min(1),
    type: RoomAssetTypeSchema,
    x: z.number().finite(),
    y: z.number().finite(),
    rotation: z.number().finite().min(0).max(360),
  })
  .loose();

export const AllergyFlagSchema = z.enum([
  'nut',
  'gluten',
  'dairy',
  'shellfish',
  'egg',
  'soy',
  'vegan',
  'kosher',
  'halal',
]);
export const RsvpStatusSchema = z.enum(['attending', 'declined', 'pending']);

export const GuestSchema = z
  .object({
    id: z.string(),
    fullName: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    mealSelection: z.string(),
    party: z.string(),
    dietaryNotes: z.string().max(500).optional(),
    allergyFlags: z.array(AllergyFlagSchema).optional(),
    rsvpStatus: RsvpStatusSchema.optional(),
  })
  .loose();

export const TableSchema = z
  .object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    shape: z.enum(['round', 'rectangle']),
    capacity: z.number(),
    guests: z.array(GuestSchema),
    name: z.string(),
    tableNumber: z.number(),
    tableSize: z.string(),
    commonUse: z.string(),
    defaultChairs: z.number(),
    maxChairs: z.number(),
    isHeadTable: z.boolean().optional(),
  })
  .loose();

const RoomRectangleSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    realWorldWidth: z.number(),
    realWorldHeight: z.number(),
    isVisible: z.boolean(),
  })
  .loose();

const BackgroundImageSchema = z
  .object({
    backgroundImage: z.string().nullable(),
    imageOpacity: z.number(),
    imagePosition: z.object({ x: z.number(), y: z.number() }).optional(),
    imageScale: z.number().optional(),
  })
  .loose();

export const AppSettingsSchema = z
  .object({
    roomOutline: RoomRectangleSchema,
    roomBorder: RoomRectangleSchema,
    backgroundImage: BackgroundImageSchema,
    isReferenceLocked: z.boolean(),
  })
  .loose();

export const ColorThemeSchema = z
  .object({
    name: z.string().min(1).max(50),
    value: z.string(),
    rgb: z.string(),
    description: z.string().max(200).optional(),
    secondary: z.string().optional(),
    secondaryRgb: z.string().optional(),
  })
  .loose();

export const AppDataSchema = z
  .object({
    version: z.string(),
    lastModified: z.number().optional(),
    tables: z.array(TableSchema).max(MAX_TABLES),
    guests: z.array(GuestSchema).max(MAX_GUESTS),
    assets: z.array(RoomAssetSchema).max(MAX_ASSETS).default([]),
    settings: AppSettingsSchema,
    colorTheme: ColorThemeSchema.nullable().optional(),
  })
  .loose();

/**
 * Schema for a configuration file produced by `exportConfiguration` —
 * AppData with an optional `colorTheme` and `exportDate` wrapper.
 */
export const ConfigImportSchema = AppDataSchema.extend({
  exportDate: z.string().optional(),
});

export const MealOptionsSchema = z.array(
  z
    .object({
      value: z.string(),
      label: z.string(),
    })
    .loose(),
);

/**
 * Schema for a single sanitized row from CSV/Excel guest imports.
 * Enforces per-field length bounds to guard against oversized inputs
 * that slipped through upstream parsing.
 */
export const ImportedGuestRowSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  party: z.string().max(150),
  mealSelection: z.string().max(100),
});

export type ParsedConfigImport = z.infer<typeof ConfigImportSchema>;
export type ImportedGuestRow = z.infer<typeof ImportedGuestRowSchema>;
