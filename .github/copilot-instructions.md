# Project Guidelines

## Tech Stack

Expo (SDK 54) + React Native + TypeScript (strict). Bun as package manager and runtime. Firebase/Firestore for backend. TanStack React Query for external API data. expo-router for file-based routing.

## Build and Test

```bash
bun i                          # Install dependencies
bun start                      # Dev server
bun test                       # Run all tests (Bun test runner)
bun test --watch               # Watch mode
bun run format                 # Format with oxfmt
bun run lint                   # Lint with oxlint
bun run lint:styles            # Check unused styles in createStyles
bun run check:types            # TypeScript type check (bunx tsc --noEmit)
```

Pre-commit runs: `oxfmt` → `oxlint --fix` → unused styles check → type check → `bun test`.

## Code Style

- **Formatter**: oxfmt (NOT prettier). **Linter**: oxlint (NOT eslint). Disable rules with `// oxlint-disable <rule>`.
- **Files**: kebab-case. **Components**: PascalCase functions. **Hooks**: `use` prefix, camelCase.
- **Imports**: Use path aliases (`utils/theme`, `db/collections`, `types/option`). Relative imports only for siblings (`./types`). Use `import type` for type-only imports.
- **Module boundaries**: Top-level shared dirs (`hooks/`, `utils/`, `components/`, `constants/`, `types/`, `queries/`) can be imported from anywhere. Screen internals (e.g., `screens/lobby/types`, `screens/lobby/use-lobby-state`) must NOT be imported from outside that screen — import from the barrel (`screens/lobby`) instead. Only `db/hooks/*` and `db/utils/*` are public; internal db files (`db/config`, `db/collections`, `db/builders`) must not be imported outside `db/`. Shared types and constants belong in `types/` and `constants/`. Enforced by `no-restricted-imports` in [.oxlintrc.json](.oxlintrc.json).
- **Exports**: Named exports everywhere. `export default` only in route files under `src/app/`.
- **Types**: `interface` for object shapes, `type` for unions/aliases.

## Architecture

```
src/app/        → Thin route files (extract params, delegate to screens/)
src/screens/    → Screen UI + useXxxState composite hook + types + barrel index
src/components/ → Reusable UI components
src/db/         → Firestore operations, real-time hooks, types, builders
src/queries/    → TanStack Query hooks for external APIs (movies, games, books)
src/hooks/      → Generic reusable hooks
src/constants/  → Static data (topics, years)
src/types/      → Shared TypeScript types (Option, QUERY_ARGS)
src/utils/      → Utilities, theme system
```

**Screen pattern**: Screens start as a single file but expand into a folder as complexity grows. A screen folder may include `<screen>.tsx` (UI), `use-<screen>-state.ts` (composite hook), `types.ts`, and `index.ts` barrel — not all are required. When multiple files of the same kind are added (e.g., extra hooks or utils), co-locate them in subdirectories (`hooks/`, `utils/`, etc.). See [src/screens/lobby/](src/screens/lobby/) for the canonical example.

**Styling**: Always use `createStyles((t) => ({...}))` with theme tokens—never `StyleSheet.create` or inline styles. Usage: `const s = useStyles();`. Theme tokens provide colors, spacing, border, text, and shadow values. See [src/utils/theme/themes.ts](src/utils/theme/themes.ts).

**Firestore hooks**: Real-time `onSnapshot` subscriptions returning `{ data, isLoading, error }`. Write operations are plain async functions using batch writes (multi-doc creates) or transactions (read-then-write). All references go through [src/db/collections.ts](src/db/collections.ts).

## Testing

- Uses **Bun test runner** (`bun:test` imports: `describe`, `it`, `expect`, `mock`, `afterEach`). No Jest.
- Tests live in `__tests__/` directories co-located with source.
- Mock pattern: call `mock.module()` to register mocks, then dynamically `await import()` the module under test. See [src/db/__tests__/create-session.test.ts](src/db/__tests__/create-session.test.ts).
- Builders in [src/db/builders.ts](src/db/builders.ts) are pure functions (no Firestore deps) for easy unit testing.

## Project Conventions

- Three topics: games, movies, books — each with its own theme, query hook, and API. Unified via `useTopicData()` and the `Option` interface.
- Firebase config loaded from `EXPO_PUBLIC_*` env vars. Auth is anonymous (`signInAnonymously`).
- Platform-aware auth persistence: `AsyncStorage` on native, default on web.
- E2E tests use Maestro (external CLI, not in-project deps).
