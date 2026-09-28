# Architecture

## Context Hierarchy (Provider Nesting Order)

```
TooltipProvider
  AppDataProvider       -- single source of truth; loads from localStorage on mount
    ColorThemeProvider  -- 7-preset color theme + 800ms HSL interpolation (see theme-system.md)
      MealOptionsProvider -- dynamic meal option list
        SeatingDataProvider -- tables, guests, assignments, ASSETS
          AssignmentProvider -- assign/drop entry, capacity modal, last-assignment undo
            UIStateProvider   -- selectedTable, selectedAsset (single-selection invariant), zoom/pan
              RoomProvider    -- room outline/border, background image, reference scale (see room-setup.md)
```

**Selection invariant:** `selectedTableId` and `selectedAssetId` are mutually exclusive — selecting one clears the other (see [room-assets.md](room-assets.md)).

## Data Flow

### Single Write Path

```
                      AppDataProvider
                     /      |         \
                    /       |          \
    SeatingDataProvider  RoomProvider  (initial sync load from localStorage)
          |                 |
  updateSeatingSlice  updateSettings(fn)
          \                /
           \              /
   projectStore (services/projectStore.ts)
                  |
  debounced save (300ms) · flush on pagehide/hidden
                  |
        defaultRepository.saveAppData()
                  |
              localStorage
```

**Loading:** `AppDataProvider` sync-loads from `LocalStorageRepository` on mount. Persistence is synchronous and instant — there is no async/network phase.

**Saving:** When tables/guests change, `SeatingDataProvider` calls `updateSeatingSlice()` to push changes up. `RoomProvider` holds no copy of settings: it reads them from `AppDataContext` and writes via `updateSettings(fn)`. The project store owned by `AppDataProvider` merges the slices and schedules a single debounced save (300ms), flushed on `pagehide` / tab-hidden — the ONLY place that writes `AppData` to storage. Export/import (`exportJson` / `importJson`) and cross-tab `storage` events go through the same store; reloads bump `dataVersion`.

**Assignments:** Guest assignment moves a guest from `unassignedGuests[]` into `table.guests[]`. Party assignment moves all guests with a matching `party` name at once.

## The Unified Hook: `useSeating()`

```typescript
// src/hooks/useSeating.ts -- merges all 3 core contexts
const {
  seatingData,
  addTable,
  updateTable,
  moveGuests, // SeatingData
  selectedTableId,
  zoomState,
  selectTable, // UIState
  roomOutlineState,
  isReferenceLocked,
  getTableScale, // Room
} = useSeating();
```

This is the primary hook used by most components. It spreads SeatingDataContext, UIStateContext, and RoomContext together.

## Core Data Model

```typescript
// Guest -- belongs to a party, has meal selection
interface Guest {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  mealSelection: string; // e.g. "Chicken", "Beef", "No Meal Selected"
  party: string; // party/group name
}

// Table -- has position, shape, capacity, and nested guests array
interface Table {
  id: string;
  x: number;
  y: number; // canvas pixel coordinates
  shape: 'round' | 'rectangle';
  capacity: number;
  guests: Guest[]; // assigned guests live inside the table
  name: string; // "Table 1", "Table 2", etc.
  tableNumber: number; // sequential number
  tableSize: string; // e.g. '60" diameter', '72" x 30"'
  commonUse: string;
  defaultChairs: number; // standard capacity
  maxChairs: number; // absolute max with overflow
}

// SeatingData -- top-level data shape
interface SeatingData {
  tables: Table[];
  unassignedGuests: Guest[];
}

// AppData -- full persisted state
interface AppData {
  version: string; // migration target; see src/utils/migrations.ts::CURRENT_VERSION
  lastModified: number;
  tables: Table[];
  guests: Guest[];
  assets: RoomAsset[];
  settings: AppSettings; // room outline, border, background, lock state
  colorTheme?: ColorTheme;
}
```

## State Management Pattern

- **useEntityReducer** -- generic reducer for CRUD + `setEntities` on arrays of `{ id: string }` entities
- Tables, guests, and assets each get their own `useEntityReducer` instance in `SeatingDataContext`
- `setEntities()` allows bulk replacement (used by config import / demo-data load)
- All state changes flow up to `AppDataProvider` via slice updater callbacks
- Single debounced save (300ms) in `AppDataProvider` -- no competing writes
- `dataVersion` counter in `AppDataContext` bumps when another tab writes the storage key (`storage` event); `SeatingDataProvider` re-inits from the fresh snapshot

## Capacity System

Three-tier capacity checking (`src/lib/capacityChecker.ts`):

1. **WITHIN_DEFAULT** -- fits in `defaultChairs`, auto-assign
2. **EXCEEDS_DEFAULT** -- over default but under `maxChairs`, show confirmation modal
3. **EXCEEDS_MAXIMUM** -- over `maxChairs`, reject with toast

The capacity modal uses a ref-based promise pattern in `AssignmentProvider` (one modal for the whole app, no window globals).

## Canvas Coordinate System

- Tables use **pixel coordinates** (`table.x`, `table.y`)
- Room outlines/borders use **percentage coordinates** (0-100% of canvas)
- Zoom is handled via CSS `transform: scale()` + `translate()` with `transform-origin`
- Mouse coordinates are transformed via `screenToCanvas()` accounting for zoom/pan and canvas offset

## Canvas Layer System

The seating canvas uses a z-index based layer system (bottom to top):

| Layer            | Z-Index | Purpose                                           |
| ---------------- | ------- | ------------------------------------------------- |
| Boundaries       | 1       | Room outline + hazard stripes (`BoundariesLayer`) |
| Background Image | 10      | Venue floor plans                                 |
| Assets           | 25      | Dance floors, bars, DJ, speakers, partitions      |
| Tables           | 30      | Draggable tables and seats                        |
| Controls         | 40      | Zoom/pan controls                                 |

**Layer wrappers MUST be `pointer-events-none absolute inset-0`** with `pointer-events-auto` on interactive children. See [seating-canvas.md](seating-canvas.md) for the full layering rules — read it before editing the canvas. Asset-specific details (presets, schemas, drag/rotate, persistence) live in [room-assets.md](room-assets.md).

## Room & Scale System

Two-phase approach:

1. **Room Outline** (red) -- user defines reference area with known real-world dimensions
2. **Lock Reference** -- calculates `pixelsPerInch = pixelWidth / (realWorldFeet * 12)`
3. **Room Border** (purple) -- actual room boundary, auto-scaled after locking
4. Tables scale based on their real-world sizes (e.g., 60" diameter) using `pixelsPerInch`

## Banquet Summary (Client-Computed)

The Banquet Team Summary is computed entirely on the client from current seating data via `src/utils/banquetSummaryUtils.ts::buildBanquetSummary()`. The summary view (`src/pages/BanquetTeamSummary.tsx`) renders KPI cards, charts, and a parties view from the same client-side data the seating canvas uses.

## Storage (localStorage)

- **DataRepository** in `src/services/DataRepository.ts` is the only persistence layer.
- All localStorage keys are declared in `src/lib/storageKeys.ts` — don't inline new keys elsewhere.
- Data version lives in `src/utils/migrations.ts::CURRENT_VERSION`; the migration chain walks every prior version up to it.
- Single write path via `AppDataProvider` (300ms debounced save) — the **only** call site that writes `AppData`.
- Writes go through `safeLocalStorage` (see `src/lib/safeStorage.ts`), which probes for availability + enforces a 5 MB cap on JSON **objects** (primitives bypass size validation).
- Config export/import is fully client-side (Settings → Download / Upload Project).

## Table Specifications

14 predefined table types from `TABLE_SPECIFICATIONS` in `types/seating.ts`:

- **Round**: 24", 30", 36", 48", 60", 66", 72" diameter
- **Rectangle**: 48"x18", 48"x24", 60"x18", 60"x30", 72"x18", 72"x30", 96"x30"

Each has default and maximum chair counts based on real-world banquet standards.
