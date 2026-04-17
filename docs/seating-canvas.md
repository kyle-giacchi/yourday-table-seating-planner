# Seating Canvas Layering

**Scope:** `src/components/seating/SeatingCanvas.tsx` and every layer rendered inside its `CanvasLayers` component (boundaries, background, assets, tables, plus anything added later).

**Read this before touching the canvas.** The layering rules below are load-bearing — violating them silently breaks rendering or interaction in ways that are easy to miss in local testing.

## The structure

```
<div data-seating-canvas (overflow-hidden, onClick → clearSelection)>
  <CanvasLayers>
    <div absolute inset-0 (transform: pan + zoom)>
      ScaleGridOverlay          — absolute, pointer-events-none
      <div absolute inset-0 z=1>  BoundariesLayer
      BackgroundLayer           — absolute, pointer-events-none, z=10
      <div absolute inset-0 pointer-events-none z=25>
        RoomAssetView[]         — absolute, pointer-events-auto
      <div absolute inset-0 pointer-events-none z=30>
        SeatingTable[]          — absolute, pointer-events-auto
```

Everything inside the transform div is either:

1. Absolutely positioned (takes no flow space), or
2. A full-size wrapper (`absolute inset-0`) that holds absolutely positioned children.

There are **no block-flow children** in this tree. That is not an accident.

## Rule 1 — wrappers must be `absolute inset-0`, never `relative h-full`

The transform container is `absolute inset-0`, so it has a fixed height. If you add a child wrapper like `<div className="relative h-full">`, it becomes a block-flow element that takes 100% of the parent's height. A single one of those is fine; it fills the container and the canvas renders correctly.

**The moment you add a second `relative h-full` child, the two stack vertically in block flow.** The first one fills the container; the second one starts at `y = 100%` of the parent, so its content renders below the visible area and `overflow-hidden` on the outer canvas silently clips it.

This is exactly what happened when the assets layer was first added: the tables wrapper was still `relative h-full` from before, the new assets wrapper was also `relative h-full`, and tables became invisible after the next render. No error, no warning — the tables were rendering at `canvas.height + table.y` and getting clipped.

**Rule:** every child of the transform div must be `absolute inset-0` (or another form of absolute positioning). Never use `relative h-full` for a layer wrapper.

## Rule 2 — layer wrappers are `pointer-events-none`, children are `pointer-events-auto`

Once wrappers are `absolute inset-0`, they all occupy the same rectangle. The topmost wrapper in z-order captures every click in its bounds — including the empty areas between its children. A click on an empty region of the tables wrapper (z=30) would never reach the assets wrapper (z=25) below it, even if there's a visible asset at that pixel.

The fix is to make the wrappers themselves transparent to pointer events and re-enable events on the actual interactive children:

- Wrapper: `className="pointer-events-none absolute inset-0"`
- Interactive child (SeatingTable, RoomAssetView): `className="pointer-events-auto absolute ..."`

`pointer-events` is not inherited in CSS, but `pointer-events: none` on a parent does skip the parent in hit testing — children only receive events if they explicitly set `pointer-events: auto` (or another non-`none` value). Don't rely on the default; set it explicitly on any element inside a `pointer-events-none` wrapper that needs to be interactive.

This also keeps the `onClick → clearSelection` behavior on the outer canvas div working: clicks in empty canvas areas pass through every wrapper and land on the canvas itself, which deselects.

## Rule 3 — coordinates are in canvas space, not wrapper space

Tables and assets store `x, y` in canvas-space pixels (bounded by `canvasDimensions`). They render via inline `style={{ left: x, top: y }}` inside their wrapper. Because the wrapper is `absolute inset-0`, its top-left is the canvas origin, so the child's `left/top` match canvas space 1:1.

Drag handlers use `screenToCanvas(clientX, clientY, canvasRect)` where `canvasRect` is the DOMRect of the outer canvas div (looked up via `data-seating-canvas`). The result is in the same canvas space, so it can be written back to `table.x / asset.x` directly. If you introduce a new layer that's _not_ `absolute inset-0` from the canvas origin, coordinate math breaks — keep wrappers flush with the canvas or translate explicitly.

## Rule 4 — z-index order

Current order (bottom → top):

| z   | Layer             |
| --- | ----------------- |
| 0   | Canvas background |
| 1   | Boundaries        |
| 10  | Background image  |
| 25  | Assets            |
| 30  | Tables            |
| 40  | ZoomPanControls   |

Assets sit below tables so that tables (the primary interaction target) always win ties in overlap. If you add a new layer, pick a z-index with a gap (e.g. 15, 27) so there's room to reorder later without renumbering everything.

## Rule 5 — transforms, not margins

Pan and zoom apply via a single `transform` on the outer wrapper. Don't pan/zoom individual layers; the whole thing must move as one unit for coordinate math and rescale-on-resize to stay consistent. `useRescaleTablesOnResize` watches `canvasDimensions` and scales `table.x/y` when the canvas box changes — any layer that stores absolute pixel positions needs the same treatment or it'll drift after a resize.

## When adding a new layer

1. Wrap it in `<div className="pointer-events-none absolute inset-0" style={{ zIndex: N }}>`.
2. Give its interactive children `pointer-events-auto`.
3. Pick a z-index with gaps (see Rule 4).
4. If the layer stores pixel positions, add it to `useRescaleTablesOnResize` (or write a parallel hook) so it rescales with the canvas.
5. Use canvas-space coordinates via `screenToCanvas(e.clientX, e.clientY, canvasRect)`. Don't compute offsets off the layer wrapper.
6. Run the full seating test suite — the `RoomAssetFlow` smoke test catches pointer-events regressions, but visual clipping needs a manual browser check.

## History

- **2026-04-13** — Assets layer was added as `relative h-full`, which matched the existing tables wrapper style. Block-flow stacking silently pushed tables 100% below parent (invisible) and then fixing that with naive `absolute inset-0` blocked asset clicks. Rules 1 and 2 were formalized after the fix.
