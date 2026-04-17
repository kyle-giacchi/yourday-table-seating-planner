# CLAUDE.md — YourDay Room Layout Planner

**YourDay** is a visual room layout planner for event planning (weddings, galas, corporate events). Users design floor plans, place tables, manage guest lists, and assign seats. **100% client-side, no backend.**

## Before editing

1. **Read [docs/invariants.md](docs/invariants.md) first.** It's a one-page list of non-obvious rules that will break things silently if violated (context provider order, single-selection invariant, coordinate systems, layer-wrapper pattern, single-write-path persistence, party-name matching, drag-payload contract, etc.).
2. Run `npm run dev` (http://localhost:8080) and try the feature in a browser before reporting a task as complete.

## Commands

```
npm run dev            Dev server on port 8080
npm run build          Production build (console stripped via oxc.pure)
npm run typecheck      tsc --noEmit -p tsconfig.app.json   ← NOT the root tsconfig.json
npm run lint           ESLint — baseline is 0 errors / 0 warnings
npm run test           Vitest (jsdom)
npm run test:e2e       Playwright E2E
npm run format         Prettier write
```

## Stack

React 19 + TypeScript + Vite 8 (rolldown + oxc) + Tailwind CSS 4 + shadcn/ui + React Router 7. Persistence = `localStorage` only, via `DataRepository`. Validation = Zod 4 (import boundaries). Testing = Vitest 4 + Playwright.

## Documentation

| Document | When to read |
|---|---|
| [docs/invariants.md](docs/invariants.md) | Before editing anything cross-cutting — the index of brittle integrations |
| [docs/architecture.md](docs/architecture.md) | Context hierarchy, data flow, storage, coordinate systems, canvas layers |
| [docs/seating-canvas.md](docs/seating-canvas.md) | Before touching `SeatingCanvas.tsx`, `CanvasLayers`, or any layer wrapper |
| [docs/room-assets.md](docs/room-assets.md) | Before touching assets, the selection invariant, or `src/components/seating/asset/` |
| [docs/room-setup.md](docs/room-setup.md) | `/room-setup` wizard, image upload, scale math, `pixelsPerInch` |
| [docs/theme-system.md](docs/theme-system.md) | Color theme pipeline (HSL interpolation, edge glow, auto-rotate) |
| [docs/styling-guide.md](docs/styling-guide.md) | Tailwind conventions, color tokens, button/badge variants |
| [docs/components.md](docs/components.md) | Component catalog + file tree |
| [docs/todos.md](docs/todos.md) | Future work, deferred items |

For contributor workflow + CI gates, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Project pivot context

Earlier versions had a Cloudflare Workers backend (auth, D1, Stripe). Everything backend-related was deleted in commit `8c1513b` when the app went standalone. Don't re-introduce `useAuth`, `isPaid`, `HybridRepository`, or `functions/` patterns — git history preserves the implementation if anyone wants to fork a hosted version.
