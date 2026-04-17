# TODOs & Future Development

## Feature Ideas

- **Undo/redo functionality** — track state changes for reversible operations (an `UndoContext` scaffold exists; not yet wired through)
- **PDF export of layouts** — generate printable room layout documents
- **Template system** — common venue layouts as starting points
- **Progressive Web App** — offline-first with service worker
- **Real-time collaboration** — would require a backend (deliberately out of scope for the open-source client-only version)

## Testing

- Expand test coverage for under-tested areas (capacity checking, safe storage, import/export boundary cases, error paths).
- See `npm run test` for the current Vitest suite, `npm run test:e2e` for Playwright E2E. Exact counts live in the test runner output — we don't pin them in docs.

## Infrastructure

- Lint backlog cleanup: ~6 tracked warnings remain under the IC-derived ruleset; new code should introduce zero new warnings.
- GitHub Actions CI gates (`format:check` → `lint` → `typecheck` → `test` → `build`) are live in `.github/workflows/ci.yml`; deploy pipelines are intentionally absent — forks pick their own hosting.
