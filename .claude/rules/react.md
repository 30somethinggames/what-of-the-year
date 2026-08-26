---
paths:
  - "src/**/*.{ts,tsx}"
---

# React rules

- Components are named `export function PascalCase()` declarations in kebab-case files.
- Props: a local `interface Props` directly above the component, destructured in the signature. Wrapper primitives extend the DOM attribute interface and spread `...rest`. Multi-file screens put shared props in a sibling `types.ts`.
- Merge class names with `cn()` from `utils/cn` — never string concatenation or template literals.
- Convex subscriptions live only in `src/db/use-*.ts` hooks: pass `"skip"` when an id is undefined and return `{ isLoading, <data> }`. Components never call `useQuery` directly.
- A screen's data/effects aggregate in `screens/<name>/utils/use-<screen>-state.ts`. Render order: `if (isLoading) return <Loading />;` then `if (!x) return <DisplayError />;` before any other logic.
- Thrown Convex query errors (failed authz) are handled by the root Sentry ErrorBoundary → `DisplayError` with a home link. Don't catch them per-screen.
- Multi-file component/screen folders expose an `index.ts` barrel; import folders by their barrel path.
- Conditional JSX uses an explicit ternary ending `: null` — no `&&` short-circuit rendering.
- Every interactive element E2E drives has a `data-testid` (via a `testID?: string` prop or hardcoded).
- Handlers: `on<Event>` for the action, `handle<Thing>` for wrappers, declared as `const fn = async () => {}` in the component body.
- Prefer path aliases (`components/`, `screens/`, `db/`, `utils/`, …) over deep relative imports; relative only within the same folder. `import type` for types.
