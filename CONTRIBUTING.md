# Contributing to YourDay

Thanks for your interest in contributing! This document explains how to set up your environment, the coding conventions we follow, and the gates a PR has to pass.

## Quick start

```bash
git clone https://github.com/kyle-giacchi/yourday-table-seating-planner.git
cd yourday-table-seating-planner
npm install
npm run dev    # http://localhost:8080
```

No env vars, no backend, no database. The app is 100% client-side.

## Development workflow

1. Fork the repo and create a feature branch from `main`.
2. Make your changes in small, focused commits.
3. Run the local checks (see below) before pushing.
4. Open a pull request against `main`. CI will run lint, format, type check, tests, and build.
5. A maintainer will review and merge.

### Branch naming

We use lightweight prefixes:

- `feat/` — new feature
- `fix/` — bug fix
- `refactor/` — internal cleanup with no behavior change
- `docs/` — documentation only
- `test/` — tests only
- `chore/` — tooling, config, dependencies

Example: `feat/round-table-rotation`

### Commit messages

Conventional Commits style. Keep the subject line under ~70 characters.

```
feat(seating): add rotation handle to round tables
fix(guest-import): handle Excel sheets with merged header cells
docs(readme): document the standalone-mode design choice
test(reducers): cover the assignParty edge case
chore(deps): bump vitest to 4.2
```

The body is optional but encouraged for non-trivial changes — explain _why_, not _what_.

## Local checks (must pass before pushing)

```bash
npm run format:check   # Prettier
npm run lint           # ESLint, 0 errors expected
npm run typecheck      # tsc --noEmit -p tsconfig.app.json
npm run test -- --run  # Vitest
npm run build          # Vite production build
```

CI runs the same gates in `.github/workflows/ci.yml`. A PR that fails any of these will not be merged.

## Coding conventions

### TypeScript

- Frontend `tsconfig.app.json` is strict (`noImplicitAny: true`, `strictNullChecks: true`).
- Prefer `unknown` + narrowing over `any`. New code must not introduce `any`.
- Use the `@/` path alias for src imports.

### React

- Functional components with hooks. The only class component is `ErrorBoundary`.
- Drag-and-drop uses a typed `application/json` `DataTransfer` payload.
- Pages are lazy-loaded via `React.lazy()` + `Suspense` in `App.tsx`.
- Don't add new context providers unless the state is genuinely shared. Prefer composition.

### Styling

- Always Tailwind utility classes. Inline styles only for dynamic values.
- Theme colors come from CSS variables set by `ColorThemeContext` (`hsl(var(--primary))`).
- Use shadcn/ui component variants — don't ship custom button styling.

### Tests

- Vitest, co-located in `__tests__/` directories.
- Test the behavior, not the implementation. Prefer Testing Library queries.
- Backend HTTP/DB tests are gone — there is no backend in this codebase. If you re-introduce one, treat it as a separate package.

### Lint discipline

- `eslint-disable` comments require a `-- <reason>` description (`@eslint-community/eslint-comments/require-description`).
- Function complexity is capped at 15 (`complexity: 15`). Refactor before merging.
- `no-console` allows `console.error` and `console.warn` only — production builds strip the rest.

## Code review

- Be specific. "This breaks X because Y" beats "I don't like this."
- Propose alternatives, not just objections.
- Approve when the change is correct and meets conventions, even if you would have written it differently.

## Reporting bugs

Use the GitHub issue templates in `.github/ISSUE_TEMPLATE/`. Include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser + OS
- A minimal config export (Settings → Download Project) if the bug depends on data state

## Reporting security issues

**Do not open a public issue for security vulnerabilities.** See [SECURITY.md](SECURITY.md) for the disclosure process.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
