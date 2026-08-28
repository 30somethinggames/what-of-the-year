---
paths:
  - "playwright/**"
  - "**/__tests__/**"
  - "**/*.test.ts"
---

# Testing rules

- Unit tests: `bun:test` (`import { describe, expect, it } from "bun:test"`) in a `__tests__/` folder beside the code, named `<subject>.test.ts`, with module-level `mock*` fixtures.
- Convex functions are tested with `convex-test`, including negative authz cases (non-member, non-host, wrong state) for every guard.
- E2E specs: `playwright/<area>/<name>.e2e.ts`, driving the app exclusively through `page.getByTestId(...)` with `await expect(...)` assertions between steps.
- Seed/teardown server state through the `playwright/helpers/convex.ts` HTTP helpers — never through the UI.
- Never weaken a failing test to make it pass (no loosened assertions, added retries, or skips). If the test looks wrong, say so in the PR instead.
- No tautological tests — a test that cannot fail when the code is wrong because it restates the implementation. Expected values are literals or fixtures, never computed with the same expression the code under test uses; never assert a mock returns what it was told to return, compare a value to itself, snapshot without asserting content, or check only that a function was called when the ticket is about what it returns.
