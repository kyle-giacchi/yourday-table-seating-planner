# Critical Invariants

One scannable page of non-obvious rules that will quietly break things if violated. Read before touching any area you don't already know.

Each item has a pointer to the authoritative file or doc where the real detail lives. If you change behavior in one of these areas, update this page.

---

## 1. Context provider order

```
TooltipProvider
  AppDataProvider          — loads from localStorage; single source of truth
    ColorThemeProvider
      MealOptionsProvider
        SeatingDataProvider  — tables, guests, ASSETS (slice updaters push up)
          AssignmentProvider — the one capacity-confirm modal + last-assignment undo
            UIStateProvider  — selection, zoom/pan (single-selection invariant)
              RoomProvider   — outline, border, reference scale (slice updater)
```

- `AppDataProvider` **must** wrap `SeatingDataProvider` and `RoomProvider` — both push changes up via slice updaters.
- `SeatingDataProvider` must wrap `UIStateProvider` (selection needs table/asset IDs it references).
- Don't shuffle without reading the slice-updater wiring in `AppDataProvider.tsx`.

→ [architecture.md](architecture.md)

## 2. Single-selection invariant

`UIStateContext.selectedTableId` and `selectedAssetId` are **mutually exclusive**.

- `selectTable(id)` auto-clears `selectedAssetId`.
- `selectAsset(id)` auto-clears `selectedTableId`.
- Renderers rely on this to decide which set of handles/pills to show.

→ [room-assets.md](room-assets.md) §Selection invariant

## 3. Coordinate systems (pixel vs percent)

Two systems live side by side on the seating canvas:

| Data                                           | Coordinate system             |
| ---------------------------------------------- | ----------------------------- |
| `table.x`, `table.y`, `asset.x`, `asset.y`     | canvas-space **pixels**       |
| `roomOutline.x/y/width/height`, `roomBorder.*` | **percent** of canvas (0–100) |

Mouse events go through `screenToCanvas(clientX, clientY, canvasRect)` in `src/components/seating/utils/coordinates.ts` — always use it instead of computing offsets off a layer wrapper.

`useRescaleTablesOnResize` in `SeatingCanvas.tsx` scales table pixel coords when the canvas box changes. Any new layer that stores pixel coords needs a parallel rescale or it drifts after resize.

→ [seating-canvas.md](seating-canvas.md) Rule 3 · Rule 5

## 4. Canvas layer structure

Every child of the transform div must be `absolute inset-0` — **never** `relative h-full`. Two `relative h-full` siblings silently stack in block flow and disappear below the visible area.

Layer wrappers are `pointer-events-none`; interactive children re-enable with `pointer-events-auto`. Without this, the topmost wrapper eats clicks meant for layers below.

→ [seating-canvas.md](seating-canvas.md) Rules 1–5

## 5. Single-write-path persistence

The project store (`src/services/projectStore.ts`, owned by `AppDataProvider`) is the **only** writer to localStorage for `AppData`. `SeatingDataProvider` pushes via `updateSeatingSlice` / `updateAssetsSlice`; `RoomProvider` reads `settings` straight from the store and writes via `updateSettings(fn)`. A 300 ms debounce coalesces writes; `pagehide` / tab-hidden flushes it.

- Export and import go through `useAppData().exportJson()` / `importJson()`: both flush first, and a successful import reloads memory so a stale pending save can't overwrite it.
- Anything that wipes localStorage wholesale must call `discardPending()` first, or the unload flush writes the old project back.
- Never call `defaultRepository.saveAppData` / `importConfiguration` from components.

→ [architecture.md](architecture.md) §Data Flow · `src/contexts/AppDataProvider.tsx`

## 6. Storage keys are centralized

All `localStorage` keys live in `src/lib/storageKeys.ts`. Don't inline new keys in components — collisions are silent, and a central registry is the only way to audit what gets persisted.

Always read/write through `safeLocalStorage` (in `src/lib/safeStorage.ts`), never raw `localStorage`. The wrapper guards against SSR + quota errors.

## 7. safeLocalStorage + JSON primitives

`safeLocalStorage.setItem` enforces the 5 MB cap **only on JSON objects**. Primitives (`"true"`, `"1"`, `"false"`, plain strings) bypass size validation so single-flag writes don't get rejected by `validateStorageData`.

If you change `setItem`, the two pathways to preserve:

1. Non-JSON strings pass through (caught by `JSON.parse` throw).
2. JSON primitives pass through (explicit `typeof parsed === 'object'` check).

Only objects hit `validateStorageData`. Break this and coach-mark / first-run flags silently fail to save.

→ `src/lib/safeStorage.ts`

## 8. Party name matching is case-insensitive

Parties group on a normalized key. **Never compare `guest.party` with `===` directly** — use `samePartyName(a, b)` / `partyKey(name)` from `src/utils/partyUtils.ts`. Raw equality treats `"Smith Family"` and `"smith family"` as different parties and splits them across the UI.

All downstream party utilities (`getPartyAssignmentStatus`, `getEnhancedPartiesFromGuests`) already route through `samePartyName`. Assign / unassign / reorder / drop-preview transitions live in the pure `src/utils/seatingModel.ts`; `addGuest` and `updateGuest` canonicalize `party` to the casing already in use via `canonicalPartyName`. Add new party logic there, not in components.

→ `src/utils/partyUtils.ts` · `src/utils/seatingModel.ts`

## 9. Drag-and-drop data contract

Drag payloads go through a typed `DragData` union in `src/types/dragDrop.ts`:

```typescript
{ type: 'guest', guestId, sourceTableId?, partyName? }
{ type: 'party', partyName, partySize?, sourceTableId? }
```

Always start drags via the helpers in `src/utils/dragUtils.ts` (`startGuestDrag`, `startPartyDrag`). Never set `dataTransfer.setData` directly — the drop handler reads only `application/json` and can't validate an ad-hoc payload. (`text/plain` is still set, for browsers that refuse a drag without it; nothing reads it.)

`parseDragData(jsonString)` returns the typed value or `null`; handlers should check for `null` before using it.

Every drop onto a table and every "assign to table" menu goes through `useTableAssignment()` — `dropOnTable(e, tableId)` or `assign(data, tableId)` — backed by `AssignmentProvider`. It owns capacity rules, the single `CapacityModal`, the success toast and undo. Don't render a second `CapacityModal` or call `moveGuests` directly for a user-initiated assign.

## 10. Demo data replaces state

`loadDemoData()` in `SeatingDataContext` **overwrites** tables and guests with the `DEMO_*` fixtures in `DataRepository.ts`. Assets are **not** reset — they survive the load. There is no confirmation, no undo, no merge. Only call it from the homepage's "Try it with Demo Data" entry point — wiring it to any other button will silently wipe real projects.

## 11. Guest import is pure

`src/services/guestImportService.ts` has **no side effects** — it parses CSV / Excel to `{ rows, errors }`, and the caller is responsible for persisting via context. Don't add a save inside the service; the test suite relies on its purity and the import flow elsewhere assumes the service is safe to re-run.

Column detection is fuzzy — `firstName`, `first`, `first_name`, `given name`, etc. all map to the same field. Edit the matcher carefully; regression tests in `__tests__/guestImportService.test.ts` cover common header variants but not all.

## 12. React Compiler + manual memoization

The project uses React 19's compiler. Manual `useCallback` / `useMemo` can **fight** auto-memoization when deps reference refs (e.g. `wasDragged.current`). The compiler emits "Compilation Skipped" warnings when it detects a mismatch and silently opts that component out of optimization.

Rule of thumb: if a handler only uses a stable ref and a few simple values, drop the manual `useCallback` and let the compiler do it. The current baseline is **0 warnings** — any new "Compilation Skipped" warning means you've accidentally re-introduced the conflict.

→ `eslint.config.js` · `src/components/seating/table/SeatingTable.tsx` (onMouseUp, for the pattern)

## 13. Complexity cap has scoped overrides

`complexity: ['warn', { max: 15 }]` globally, bumped to `25` for `src/pages/**` and `src/components/common/UnifiedAssignmentPanel.tsx` via `eslint.config.js` override. Page-level containers with stage/mode branching legitimately exceed 15; leaf functions must not. Refactor before adding new paths into the override list.

## 14. Console hygiene

Production (via `oxc.pure`) strips `console.log`, `console.debug`, `console.info`, `console.warn`. Only `console.error` survives. ESLint's `no-console` enforces the same: only `error` and `warn` are allowed in source. Don't rely on `console.log` for anything user-observable in production.

## 15. Test harness quirks

- jsdom has no `ResizeObserver` — tests that mount the canvas or room-setup wizard must stub it (see `RoomAssetFlow.test.tsx` `beforeAll`).
- The async `dragUtils.test.ts` emits a harmless jsdom `NotFoundError` during teardown; known noise, not a regression.
- Playwright visual snapshots are platform-stamped (`chromium-win32.png`) — running on macOS / Linux will produce diffs. Regenerate via `npm run test:e2e -- --update-snapshots` on your target CI platform before merging.

---

## Updating this doc

If you change one of the behaviors above, update the matching section here **in the same commit**. Prefer linking to authoritative files over duplicating explanations — this page is an index, not a source of truth.
