# Room Setup Flow

**Scope:** The dedicated `/room-setup` page and everything in `src/components/room-setup/`. This is the multi-step wizard that gets users from "blank canvas" to "scaled venue with a measured reference rectangle" before they start placing tables. Read this before changing the stepper, the scale rectangle, or anything that touches `pixelsPerInch` derivation.

## Entry points

Three places navigate users into `/room-setup`:

| Source                                     | Trigger                                               |
| ------------------------------------------ | ----------------------------------------------------- |
| `src/pages/Index.tsx`                      | "Upload your floor plan" button on the welcome screen |
| `src/components/navigation/TopNavbar.tsx`  | "Room Setup" item in the settings dropdown            |
| `src/components/seating/CanvasToolbar.tsx` | "Edit room layout" button on the seating canvas       |

The "Quick Setup" path on `Index.tsx` deliberately **bypasses** room setup — it picks a guest/table count and drops the user straight into `/room-layout` with an empty canvas. Room Setup is for users who want a real venue floor plan with accurate scale.

## Page structure

`src/pages/RoomSetup.tsx` is a thin two-step orchestrator:

```
RoomSetup
  ├── SetupStepper (header)
  ├── StepUploadImage  (currentStep === 1)
  └── StepSetScale     (currentStep === 2)
```

Step state lives locally (`useState(initialStep)`); persisted state lives in `RoomContext`. The page reads `backgroundImageState` and `isReferenceLocked` from `useSeating()` to compute `completedSteps` for the stepper visualization.

**Re-entry behavior:** if the user already uploaded an image (`hasImage === true`), `initialStep = 2` so they jump straight to scale-setting. The `useMemo` dependency list is intentionally empty (mount-only snapshot) so flipping `hasImage` mid-session doesn't reset the step — the eslint disable on that line documents the intent.

## Components

```
src/components/room-setup/
  SetupStepper.tsx        # Step indicator + back navigation chrome
  StepUploadImage.tsx     # Drop zone + file picker; magic-byte validation; aspect-ratio warnings
  StepSetScale.tsx        # Scale-setting orchestrator: dimensions input, preset picker, lock toolbar
  ScaleRectangle.tsx      # Draggable/resizable orange rectangle (the reference area)
  ScaleReferenceShape.tsx # Sanity-check shapes rendered at the locked scale
  ScaleSetupGrid.tsx      # 1-foot grid overlay (toggleable when locked)
  GhostTablePreview.tsx   # Draggable 60" round preview (currently unused)
```

| Component             | Role                                                                                                                                                                                                       | Key props                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `SetupStepper`        | Renders the two-step header pill row, marks `completedSteps` with checks, drives navigation via `onStepClick`.                                                                                             | `currentStep`, `completedSteps`, `onStepClick`                                  |
| `StepUploadImage`     | Drag-and-drop + file input. Validates MIME + magic bytes. Warns on extreme aspect ratios. Calls `setBackgroundImage(dataUrl)` on success and `onNext()` to advance.                                        | `onNext()`                                                                      |
| `StepSetScale`        | Owns the editable real-world dimensions, the unlocked vs locked toolbar modes, and the visibility toggles for reference shapes / grid. Composes `ScaleRectangle`, `ScaleReferenceShape`, `ScaleSetupGrid`. | `onBack()`                                                                      |
| `ScaleRectangle`      | Orange overlay rectangle stored as percentages (0–100 %). Drag to move, handles to resize. Aspect-ratio constraint optional. Disabled in locked mode.                                                      | `x, y, width, height` (%), `onChange`, `aspectRatio?`, `labelText?`, `disabled` |
| `ScaleReferenceShape` | Renders a 60" round table, a 3 × 7 ft door, or a person silhouette at the current `pixelsPerInch`. Lets users sanity-check that the scale "feels right" against the photo.                                 | `shape`, `widthInches`, `heightInches`, `pixelsPerInch`, container dims         |
| `ScaleSetupGrid`      | SVG 1-foot grid drawn at `pixelsPerInch * 12` spacing. Toggleable in locked mode for visual confirmation.                                                                                                  | `pixelsPerInch`, container dims                                                 |
| `GhostTablePreview`   | A draggable 60" round preview. Currently unused — kept for future "preview a table before committing" UX. Don't delete without confirming with the team.                                                   |

## Data flow

Setup state lives in `appData.settings` and is mutated through `useRoomOperations()` (which `RoomContext` exposes). Every change flows up to `AppDataContext.updateSettingsSlice()` and rides the standard 300 ms debounced save.

```
StepUploadImage
   └── setBackgroundImage(dataUrl | null)
         └── appData.settings.backgroundImage = { backgroundImage, imageOpacity }

StepSetScale (unlocked)
   ├── updateRoomOutline({ x, y, width, height })           # rectangle position/size (%)
   ├── updateRoomOutline({ realWorldWidth, realWorldHeight }) # dimensions in feet
   └── lockReference()
         └── appData.settings.isReferenceLocked = true
              + computed pixelsPerInch becomes the active room scale

StepSetScale (locked)
   └── unlockReference()
         └── appData.settings.isReferenceLocked = false
```

Persistent shape (in `appData.settings`):

```typescript
backgroundImage: {
  backgroundImage: string | null;
  imageOpacity: number;
}
roomOutline: {
  (x, y, width, height);
  (realWorldWidth, realWorldHeight);
  isVisible;
}
isReferenceLocked: boolean;
```

## Scale math

The scale derivation lives in `src/utils/roomUtils.ts::calculateReferenceScale()`:

```
ppfFromWidth  = (width%  × canvasWidth)  / realWorldWidth
ppfFromHeight = (height% × canvasHeight) / realWorldHeight
pixelsPerFoot = avg(ppfFromWidth, ppfFromHeight)  // fall back to whichever is valid
pixelsPerInch = pixelsPerFoot / 12
```

Each rectangle edge independently encodes pixels-per-foot. `StepSetScale` constrains the visual aspect ratio to match the real-world aspect, so both values should agree; averaging adds robustness. Legacy "line-only" data (`height === 0` or `realWorldHeight === 0`) falls back to the width-derived value.

- Rectangle dimensions are stored as percentages (0–100) so they remain meaningful when the canvas resizes.
- `canvasWidth` / `canvasHeight` come from `useUIState().canvasDimensions` — the same DOMRect-derived size used by the seating canvas. Keep them in sync; if you change which element is observed, the scale shifts.
- Once `lockReference()` is called, `getTableScale()` returns this `pixelsPerInch` and **all tables and assets** start rendering at real-world size. Unlocking lets the user re-edit dimensions.

The `ScaleReferenceShape` overlays exist so users can verify the scale visually before committing — if a 60" table looks the size of a coffee cup against the floor plan, the dimensions are wrong.

## Tests

There is currently **no `__tests__/` directory under `src/components/room-setup/`**. This is a known gap — the scale math is tested indirectly through `roomUtils` tests and the canvas integration tests, but the stepper UI and `StepUploadImage` validation paths are not. New work in this folder is a good opportunity to add coverage.

## When changing the stepper

- The `initialStep` memo is mount-only on purpose (eslint comment is load-bearing). Don't add `hasImage` to the dependency array unless you also re-think re-entry.
- Step state is local — it does not get persisted. If you need to remember the user's progress across reloads, add a field to `appData.settings`, not to `useState`.
- Locked vs unlocked toolbars in `StepSetScale` differ structurally — they're not the same JSX with a `disabled` flag. Read both branches before refactoring.
- Any change that touches `calculateReferenceScale()` cascades through every table and asset on the canvas — bench against `roomUtils` tests and the seating integration suite before merging.
