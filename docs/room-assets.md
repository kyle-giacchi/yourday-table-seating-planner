# Room Assets

**Scope:** Non-table objects (dance floors, bars, DJ setups, speakers, partitions, serving tables) that live on the seating canvas alongside tables. Read this before touching anything in `src/components/seating/asset/`, `src/constants/roomAssets.ts`, or the asset slice of `SeatingDataProvider`.

Sister doc: [seating-canvas.md](seating-canvas.md) covers the canvas layering rules that the asset layer must obey.

## Data model

```
src/types/seating.ts              # RoomAssetType enum + RoomAsset interface
src/constants/roomAssets.ts       # ROOM_ASSET_PRESETS catalog + formatAssetSize()
src/types/appData.ts              # AppData.assets: RoomAsset[]
```

```typescript
type RoomAssetType =
  | 'serving-table'
  | 'dj-setup'
  | 'speaker'
  | 'dance-floor-medium'
  | 'dance-floor-large'
  | 'partition-horizontal'
  | 'partition-vertical';

interface RoomAsset {
  id: string; // 'asset-${Date.now()}-${randomId}'
  type: RoomAssetType;
  x: number; // canvas-space pixels (same as Table.x)
  y: number;
  rotation: number; // degrees, 0-360 (clockwise)
}
```

Dimensions live in `ROOM_ASSET_PRESETS[type] = { label, widthInches, heightInches, category }` — the asset itself stores **only** position/rotation/type. Real-world inches → pixels at render time via the room scale (`getTableScale()`), so assets resize with the room exactly like tables.

Categories: `Service`, `Dance Floor`, `Partitions`. They drive the grouping in `AddAssetDropdown`.

## Validation (Zod)

`src/schemas/appData.ts` — `RoomAssetSchema` with `.finite()` on x/y and `.min(0).max(360)` on rotation. `AppDataSchema.assets = z.array(...).max(200).default([])`.

The schema rejects `NaN`, `Infinity`, empty `id`, and out-of-range rotation. Bounds are tested in `src/schemas/__tests__/appData.assets.test.ts`.

## State management

```
AppData.assets[]
  -> AppDataProvider.updateAssetsSlice()      # debounced save path
  -> SeatingDataProvider.assetReducer         # useEntityReducer<RoomAsset>
       -> useSeatingOperations: addAsset / updateAsset / removeAsset
       -> useSeatingSyncEffects: re-init from latestAssets when dataVersion increments
  -> useSeating().assets                      # consumer-facing
```

Assets ride the same single-write-path pipeline as tables and guests — there is no separate persistence track. `SeatingDataContext` exposes:

```typescript
assets: RoomAsset[];
addAsset(asset: Omit<RoomAsset, 'id'>): void;   // generates id internally
updateAsset(id: string, patch: Partial<RoomAsset>): void;
removeAsset(id: string): void;
```

### Selection invariant

`UIStateContext` adds `selectedAssetId: string | null` next to `selectedTableId`. The provider enforces a **single global selection**:

- `selectAsset(id)` clears `selectedTableId`.
- `selectTable(id)` clears `selectedAssetId`.
- `clearSelection()` resets both.

Never select an asset and a table simultaneously — the rendering layer relies on this to know which set of handles/pills to show.

### Backward compatibility

`DataRepository.loadAppData()` checks `!Array.isArray(data.assets)` and coerces to `[]` on both the migration path and the modern-version path. Old payloads load cleanly; the next save writes the field through. No version bump, no migration script.

## Rendering layer

The asset layer is **z-index 25**, rendered in `CanvasLayers` inside `src/components/seating/SeatingCanvas.tsx` between the background image (z=10) and the tables layer (z=30). It MUST stay below tables — tables are the primary interaction target and need to win overlap ties.

The layer wrapper is `pointer-events-none absolute inset-0` and the children (`RoomAssetView`) re-enable events with `pointer-events-auto`. **Do not** change either of these — see [seating-canvas.md](seating-canvas.md) Rules 1 and 2 for the rationale (assets layer was the original cause of those rules).

```
src/components/seating/asset/
  RoomAssetView.tsx       # main asset component: render + click-to-select + drag
  AssetActionPill.tsx     # pill 40px above selected asset; Delete button
  RotationHandle.tsx      # circular handle 24px above asset; free + Shift-snap rotation
  assetVisuals.tsx        # SVG visuals for speaker/dj/dance-floor; hasCustomVisual()
  roomAssetStyles.ts      # ROOM_ASSET_STYLES map (background/border/text/shortLabel)
  useRoomAssetDrag.ts     # pointer-down → move → pointer-up; bounds-clamps; ignores
                          #   pointer-down on pill/handle via target.closest()
src/components/seating/hooks/useRoomAssetDimensions.ts
                          # memoized inches × pixelsPerInch → {width, height}
```

| File                     | Role                                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RoomAssetView`          | Wires position, dimensions, click-to-select, drag, and conditional pill/handle rendering. Uses a `wasDragged` ref so a drag never fires `selectAsset` on mouseup.                                                 |
| `AssetActionPill`        | Single Delete button positioned 40 px above the asset's top edge, horizontally centered on the post-rotation bounding box.                                                                                        |
| `RotationHandle`         | Computes angle from asset center to pointer; updates `rotation` live. Holding `Shift` snaps to 15° increments via `snapDegrees(value, 15)`. Result is normalized to 0–360.                                        |
| `assetVisuals`           | SVG components for speaker, DJ deck, and dance floor (parquet pattern). `hasCustomVisual(type)` decides whether to render a visual or fall back to the styled label.                                              |
| `roomAssetStyles`        | Tailwind background/border/text classes per type plus a `shortLabel` for plain-text assets (serving table, partitions).                                                                                           |
| `useRoomAssetDrag`       | Drag lifecycle. Computes offset on mousedown, RAF-throttles mousemove, clamps the new center inside the canvas bounds via `constrainPosition()`. Bails if the pointer-down target is the pill or rotation handle. |
| `useRoomAssetDimensions` | Memoized `{width, height}` derived from preset inches × current scale. Recomputes only when `type` or scale changes.                                                                                              |

## Toolbar entry point

`src/components/seating/AddAssetDropdown.tsx` — Lucide `Sofa` icon, label "Add Asset". Items are grouped by category (`SERVICE`, `DANCE FLOOR`, `PARTITIONS`) and each shows the label + real-world size (e.g. "Serving Table — 8 × 2.5 ft").

On click:

1. Compute placement at the current viewport center ± random jitter (≈40 px) so consecutive adds don't stack perfectly.
2. `addAsset({ type, x, y, rotation: 0 })` — id generated by the reducer.
3. `clearSelection()` — user must click the new asset to interact (avoids accidental drag-on-create).
4. Toast confirmation.

Wired into `CanvasToolbar` immediately to the left of `AddTableDropdown` in the "Create" zone.

## Interactions

- **Select** — click an asset body. Sets `selectedAssetId`, clears `selectedTableId`, shows pill + rotation handle. Click empty canvas → `clearSelection()`. Press Escape inside `RoomAssetView` → `clearSelection()`.
- **Drag** — pointer-down on the asset body (not the pill or handle) enters drag mode. Position updates flow through `updateAsset(id, { x, y })`, clamped by `constrainPosition()`. Drag suppresses the click → no spurious select-on-drag.
- **Rotate** — drag the rotation handle. Angle is computed from the asset center to the pointer; live `updateAsset(id, { rotation })`. Holding `Shift` snaps to 15° increments.
- **Delete** — click the trash button on the action pill → `removeAsset(id)`.

## Tests

| File                                                         | Coverage                                                                                             |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `src/contexts/__tests__/SeatingDataProvider.assets.test.tsx` | reducer: addAsset generates id, updateAsset patches, removeAsset filters                             |
| `src/schemas/__tests__/appData.assets.test.ts`               | round-trip parse, missing field defaults, invalid type/rotation rejection                            |
| `src/services/__tests__/DataRepository.assets.test.ts`       | localStorage load/save with backward-compat coercion                                                 |
| `src/components/seating/__tests__/RoomAssetFlow.test.tsx`    | integration smoke: add → select → delete; also catches pointer-events regressions on the asset layer |

## When adding a new asset type

1. Add the literal to `RoomAssetType` in `src/types/seating.ts`.
2. Add an entry to `ROOM_ASSET_PRESETS` in `src/constants/roomAssets.ts` with `widthInches`, `heightInches`, `label`, `category`.
3. Add an entry to `ROOM_ASSET_STYLES` in `roomAssetStyles.ts` (background, border, text color, shortLabel).
4. Optional: if it needs a custom visual, add a component to `assetVisuals.tsx` and register it in `hasCustomVisual()`.
5. The Zod enum in `src/schemas/appData.ts` must include the new literal or the schema will silently reject the type on import.
6. Add a row to the appropriate category in `AddAssetDropdown` (or just regenerate the dropdown if it iterates the catalog by category).
7. Run `npm run test` — the schema tests will catch any enum drift.
