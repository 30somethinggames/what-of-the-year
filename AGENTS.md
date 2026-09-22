# what-of-the-year

Yearly-picks party game. Vite + React 19 + TanStack Router (file-based) + Convex backend + Tailwind 4. Runtime and package manager: bun.

Detailed rules live in `.claude/rules/` and load when you touch matching files. Cross-cutting changes should read both `convex.md` and `react.md`. They stay there: path-scoped rules have no generic equivalent, and nested `AGENTS.md` files would scatter five rules across `convex/`, `src/`, `src/routes/` and every `__tests__/`.

Docs, read when relevant:

- `docs/game.md`: the game as a player sees it, phase by phase, every rule numbered — and the discrepancies the code has with itself.
- `docs/contributing.md`: branches, commits, PR process, what to disclose, and how to write a ticket or PR body — including that nothing is hard-wrapped, because GitHub renders every newline as a line break.
- `docs/local-dev.md`: checks, e2e, the shared dev deployment, generated files.
- `docs/verify.md`: how a change is developed and recorded for its PR — `mise run backend` once per checkout, the app running while you work, a clip or screenshot per acceptance criterion embedded in the description.
- `docs/release.md`: how releases are cut.

## Checks

`mise run check` is format, lint, types and unit tests; run it before pushing. `mise run test:e2e` creates its own Convex preview deployment and needs only `CONVEX_DEPLOY_KEY` in the environment. `mise run ci` is both, and is exactly what CI runs. `mise tasks` lists them.

## Invariants

- **Show the change**: a PR touching anything under `src/` that renders embeds a video or screenshot per acceptance criterion under **Verification** in its description — see "Before asking for review" in `docs/contributing.md`.
- **Disclose the unusual**: a new dependency, a `.github/` or `.claude/` change, or a regenerated file gets its own line in the PR's **Notes for reviewer** saying why.
- **Error handling in UI**: wrap every awaited Convex mutation/action call in `tryCatch` from `utils/try-catch`; on error, `Sentry.captureException(error)`, surface `error.message` via `useToast`, then early-return. Navigate/update state only on success. Never bare try/catch, never fire-and-forget mutations. The one exception is anonymous sign-in, where nothing can render without an identity, so the error state replaces the toast.
- Import Sentry as a namespace (`import * as Sentry from "@sentry/react"`); it is initialized only in `services/sentry`.
- Server-side authz **throws** — see `.claude/rules/convex.md` for the contract and the single exception.
- The server's `session.status` decides which screen renders. Clients never navigate between game phases.
- **The rules are written down**: a change to behaviour a player sees also changes the matching numbered rule in `docs/game.md`, in the same PR. A new rule gets the next number in its phase.

## Git

- `type(scope): summary`, type = any Conventional Commits type, scope = area touched. PR titles too.
- Branches: `<issue#>/<slug>`. Commits and PR titles carry the type, not the branch.
- Fill every section of the PR template. `Closes #<issue>` goes in the PR **description**, one line per ticket.
- Never add a `Claude-Session` trailer to commits or a session link to PR bodies.
