# Components & File Paths

## Key Component Areas

### Seating Canvas System (`src/components/seating/`)

Top-level components:

- **SeatingCanvas** -- main canvas with zoom/pan, background image, room overlays (exported via `index.ts`)
- **CanvasToolbar** -- toolbar above canvas (add table, image setup, config import/export)
- **AddTableDropdown** -- dropdown to add predefined table types
- **ImageLayoutSetup** -- upload + position background venue image
- **BaseRoomComponent** -- shared drag/resize behavior for room rectangles
- **TableEditor** -- right-panel barrel that delegates to `table-editor/`

Subdirectories:

- **`table/`** -- `SeatingTable.tsx` (draggable table), `TableShape.tsx` (round/rect visual), `SeatDots.tsx` (seat circles), `useTableDrag.ts`
- **`table-editor/`** -- `TableEditor.tsx` (list/detail switching), `TableListView.tsx`, `TableDetailView.tsx` (composes `parts/TableDetailBlocks.tsx` + `parts/GuestList.tsx` with `hooks/useTableDetail.ts`), `capacityUtils.ts`
- **`controls/`** -- `ZoomPanControls.tsx`
- **`layers/`** -- `BoundariesLayer.tsx` (hazard stripes), `BackgroundLayer.tsx`
- **`hooks/`** -- `useCanvasViewport.ts` (zoom + pan state), `useCanvasDropZone.ts` (drop handling), `useTableDimensions.ts`
- **`utils/`** -- `coordinates.ts`, `boundaryCalculator.ts`, `dimensionParser.ts`
- **`types.ts`** -- canvas-specific type definitions

### Guest Management (`src/components/guest/`)

- **GuestFormModal** / **GuestForm** -- add/edit individual guests
- **FileUploadModal** -- CSV/Excel upload with column mapping
- **GuestGrid** / **GuestGridRow** -- grid display of all guests
- **GuestStatsCard** -- statistics cards (total, assigned, meal breakdown)
- **MealChart** -- progress-bar-based meal breakdown (uses Radix Progress, not recharts)
- **BulkAddModal** -- bulk add guests

### Common Components (`src/components/common/`)

- **UnifiedAssignmentPanel** -- shared sidebar for guest/party drag-and-drop (used in both SeatingManager and TableView). Includes virtual scrolling via `@tanstack/react-virtual` when list exceeds `VIRTUAL_THRESHOLD` (50 items).
- **GuestCard** -- draggable guest card
- **AssignmentModeToggle** -- switch between guest/party assignment modes
- **AssignmentSearch** -- search within assignment panel
- **CapacityModal** -- confirmation dialog when exceeding default capacity
- **ErrorBoundary** -- React error boundary wrapper
- **ManagementModeToggle** -- switch between assignment/table-editor modes

### Room Setup Components (`src/components/room-setup/`)

Multi-step wizard for `/room-setup` — see [room-setup.md](room-setup.md) for the full flow.

- **SetupStepper** -- step indicator + back navigation
- **StepUploadImage** -- drag-and-drop image upload with magic-byte validation
- **StepSetScale** -- scale-setting orchestrator (dimensions, locked/unlocked toolbars)
- **ScaleRectangle** -- draggable/resizable orange overlay rectangle (in % coords)
- **ScaleReferenceShape** -- 60" table / 3×7 ft door / person silhouette at the locked scale
- **ScaleSetupGrid** -- 1-foot SVG grid overlay (toggleable when locked)
- **GhostTablePreview** -- draggable 60" round preview (currently unused, retained for future UX)

### Seating Asset Components (`src/components/seating/asset/`)

Non-table objects rendered at z-index 25 on the canvas — see [room-assets.md](room-assets.md).

- **RoomAssetView** -- main asset rendering: position, dimensions, click-to-select, drag wiring, conditional pill/handle
- **AssetActionPill** -- delete pill positioned 40 px above the selected asset
- **RotationHandle** -- circular handle for free rotation (Shift snaps to 15°)
- **assetVisuals** -- SVG visuals for speaker, DJ deck, dance floors
- **roomAssetStyles** -- Tailwind background/border/text styles per asset type
- **useRoomAssetDrag** -- pointer-down → move → pointer-up drag lifecycle (bounds-clamped)

### Theme Components

See [theme-system.md](theme-system.md) for the full transition pipeline.

- **`src/components/color/ColorSelector.tsx`** -- 7-chip grid; hover preview + click commit; emits `onHoveringChange` so the homepage can pause its 10s auto-rotate
- **`src/components/theme/ThemeChangeEdgeGlow.tsx`** -- root-mounted edge glow that fires while `ColorThemeProvider.isAnimating === true`

### Navigation (`src/components/navigation/`)

- **TopNavbar** -- persistent top navigation bar (shows LoginButton or UserMenu/UpgradeBanner based on auth state)
- **NavLink** -- navigation link component

### Table View (`src/components/table-view/`)

- **TableCard** -- card representation of a table (drop target)
- **PartyCard** -- party info within a table card
- **UnassignedParties** -- list of parties not yet assigned

### Banquet Summary (`src/components/banquet/`)

- **BanquetPaywall** -- blurred mockup with fake data + upgrade overlay (free users)
- **TableSummarySection** -- overview of all tables
- **FoodSummarySection** -- meal count breakdown
- **AssignmentSection** -- per-table assignment details
- **ExportActions** -- print/export buttons
- **SummaryCard** -- reusable stat card

## File Path Tree

```
src/
  App.tsx                           # Root component, routing, provider hierarchy
  index.css                         # CSS variables, design tokens, animations
  test/
    setup.ts                        # Vitest setup: jest-dom matchers, localStorage mock
  types/
    seating.ts                      # Guest, Table, SeatingData, TABLE_SPECIFICATIONS
    room.ts                         # RoomRectangle, ResizeHandle, ROOM_CONFIG
    appData.ts                      # AppData, AppSettings, BackgroundImageState, ColorTheme
    common.ts                       # Generic ModalProps, EntityProps, FormProps
    dragDrop.ts                     # DragData, DropHandlerOptions
  services/
    DataRepository.ts               # LocalStorageRepository — the only persistence layer
    projectStore.ts                 # AppData in memory: debounced save, flush, reload, import/export
    guestImportService.ts           # Pure function: parse/dedupe/sanitize guest imports
    __tests__/
      DataRepository.test.ts        # Repository unit tests
  contexts/
    AppDataProvider.tsx              # Subscribes to projectStore; cross-tab reload + flush on hide
    SeatingDataProvider.tsx          # Tables + guests + assignments (composes hooks from seating/)
    seating/                         # useEntityRefs, useSeatingOperations, useSeatingSyncEffects, types
    UIStateContext.tsx               # Selection, zoom, canvas dimensions
    RoomContext.tsx                  # Room layout, background, scale (pushes changes up)
    AssignmentProvider.tsx           # assign/dropOnTable, the one CapacityModal, last-assignment undo
    MealOptionsContext.tsx           # Dynamic meal option list
    ColorThemeContext.tsx            # Theme color selection
  hooks/
    useSeating.ts                   # Unified hook (all 3 core contexts merged)
    useEntityReducer.ts             # Generic CRUD reducer + setEntities for bulk replacement
    useTableAssignment.ts           # Context + hook for AssignmentProvider
    useCanvasControls.ts            # Zoom state and controls
    useCanvasDimensionsObserver.ts  # ResizeObserver for canvas element
    useRoomOperations.ts            # Room outline/border/scale operations
    useRoomInteraction.ts           # Drag/resize for room rectangles
    useKeyboardShortcuts.ts         # Generic keyboard shortcut hook
    useDebounce.ts                  # Debounce hook
    useSummaryData.ts               # Computed stats for summaries
    useColumnHeightSync.ts          # Sync column heights between panels
    use-toast.ts                    # Toast notification hook (shadcn/ui)
  utils/
    migrations.ts                   # Data version migrations (1.0.0 -> 1.1.0 -> 1.2.0)
    tableNumberUtils.ts             # Gap-filling table number assignment
    configExportUtils.ts            # Browser download of exported configuration JSON
    seatPositioning.ts              # Seat position calculations (round & rect)
    roomUtils.ts                    # Scale calculations, coordinate conversions
    partyUtils.ts                   # Party grouping utilities
    seatingModel.ts                 # Pure assign/unassign/reorder/preview transitions
    dragUtils.ts                    # Standardized drag-start handlers (guest + party)
  lib/
    capacityChecker.ts              # Three-tier capacity check
    security.ts                     # Input sanitization, validation, rate limiting
  schemas/
    appData.ts                      # Zod schemas: AppData, ConfigImport, ImportedGuestRow
    safeStorage.ts                  # Safe localStorage wrapper
    utils.ts                        # cn() classname merge utility
    guestExportUtils.ts             # CSV export
    fileUtils.ts                    # File handling utilities
    imageUtils.ts                   # Image processing
    performance.ts                  # useRAFThrottle, useCachedElement hooks
    errorReporting.ts               # Global error/rejection listeners
    __tests__/
      capacityChecker.test.ts       # Capacity checker unit tests
      safeStorage.test.ts           # Safe storage unit tests
      security.test.ts              # Security/sanitization unit tests
  pages/
    Index.tsx                       # Landing page (auto-rotates color theme every 10s; pauses on selector hover)
    SeatingManager.tsx              # Room layout canvas page
    TableView.tsx                   # Card-based table view
    GuestManagement.tsx             # Guest CRUD page
    BanquetTeamSummary.tsx          # Summary page (client-computed; DemoSummaryGate replaces old paywall)
    RoomSetup.tsx                   # Multi-step image upload + scale setup (see docs/room-setup.md)
    NotFound.tsx                    # 404 page
  components/
    seating/                        # Canvas system (see above)
      index.ts                      # Barrel: exports SeatingCanvas
      SeatingCanvas.tsx
      CanvasToolbar.tsx
      AddTableDropdown.tsx
      AddAssetDropdown.tsx          # Asset picker dropdown for the canvas toolbar
      TableEditor.tsx               # Barrel re-export from table-editor/
      types.ts
      table/                        # Table rendering + drag
      table-editor/                 # Table list/detail editor panel
      asset/                        # Room assets (RoomAssetView, AssetActionPill, RotationHandle, ...)
      controls/                     # Zoom/pan controls
      layers/                       # Background + boundary layers
      hooks/                        # Canvas-specific hooks (incl. useRoomAssetDimensions)
      utils/                        # Canvas-specific utilities
    color/                          # ColorSelector (homepage color picker)
    theme/                          # ThemeChangeEdgeGlow (root-mounted theme transition effect)
    room-setup/                     # /room-setup wizard (see docs/room-setup.md)
    guest/                          # Guest management components
    common/                         # Shared components (assignment panel, modals, etc.)
    navigation/                     # TopNavbar, NavLink, ThemeColorPicker
    table-view/                     # Card-based table view components
    banquet/                        # Banquet summary components (now client-computed; DemoSummaryGate)
    ui/                             # shadcn/ui primitives
```
