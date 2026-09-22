---
paths:
  - "playwright/**"
  - "**/__tests__/**"
  - "**/*.test.ts"
---

# Testing rules

## Layers

- Pure logic — a hook, a reducer, a helper — is a unit test under `bun:test`.
- A Convex function — query, mutation or action — is a `convex-test` test.
- Behaviour a player sees — a screen, or a flow between screens — is a Playwright spec against the run's own preview deployment.
- No component layer and no visual layer: Tailwind 4 emits `@layer`, which a fake DOM ignores; `bun:test`'s DOM has an open hang since 1.4.0; there are about fifteen components and the journey specs reach all of them.
- Revisit that when a component holds logic the journey specs cannot reach cheaply.
- Evidence: [the report on #228](https://github.com/30somethinggames/what-of-the-year/issues/228#issuecomment-5752790935).

## Rules

- Unit tests: `bun:test` (`import { describe, expect, it } from "bun:test"`) in a `__tests__/` folder beside the code, named `<subject>.test.ts`, with module-level `mock*` fixtures.
- Convex functions are tested with `convex-test`, including negative authz cases (non-member, non-host, wrong state) for every guard.
- E2E specs: `playwright/<area>/<name>.e2e.ts`, driving the app exclusively through `page.getByTestId(...)` with `await expect(...)` assertions between steps.
- Every test id comes from `src/test-ids.ts` — `getByTestId(testIds.round.pickInput)`, never a string literal. The component that renders the id reads it from the same module.
- Seed/teardown server state through the `playwright/helpers/convex.ts` HTTP helpers — never through the UI.
- Never weaken a failing test to make it pass (no loosened assertions, added retries, or skips). If the test looks wrong, say so in the PR instead.
- No tautological tests — a test that cannot fail when the code is wrong because it restates the implementation. Expected values are literals or fixtures, never computed with the same expression the code under test uses; never assert a mock returns what it was told to return, compare a value to itself, snapshot without asserting content, or check only that a function was called when the ticket is about what it returns.
