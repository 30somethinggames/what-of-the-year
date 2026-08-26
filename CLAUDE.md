# what-of-the-year

Yearly-picks party game. Vite + React 19 + TanStack Router (file-based) + Convex backend + Tailwind 4. Runtime and package manager: bun.

Detailed rules live in `.claude/rules/` and load when you touch matching files.

## Checks

Run before pushing — CI enforces all four:

```sh
bun run check:format && bun run check:lint && bun run check:types && bun test
```

E2E: `bun run test:web` (Playwright, needs `.env.local`).

## Invariants

- **Never modify without a human dev explicitly asking**: `.github/**`, `.claude/**`, `src/routeTree.gen.ts` (generated), or dependencies (`package.json` deps, `bun.lock`). Blocked work goes in the PR/ticket as a question instead.
- **Error handling in UI**: wrap every awaited Convex mutation/action call in `tryCatch` from `utils/try-catch`; on error, `Sentry.captureException(error)`, surface `error.message` via `useToast`, then early-return. Navigate/update state only on success. Never bare try/catch, never fire-and-forget mutations.
- Import Sentry as a namespace (`import * as Sentry from "@sentry/react"`); it is initialized only in `services/sentry`.
- Server-side authz **throws** — see `.claude/rules/convex.md` for the contract and the single exception.

## Git

- Conventional Commits: `type(scope): summary`, type ∈ `feat|fix|chore|ci`.
- Human work: scope `seery/<topic>`, branches `seery/<topic>`.
- Agent work: scope `agent/<topic>`, branches `agent/<issue#>-<slug>`.
- PRs use the `## Summary` / `## Changes` template and merge to `main` via squash or rebase only.
