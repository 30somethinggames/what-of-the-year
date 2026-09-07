# what-of-the-year

Yearly-picks party game. Vite + React 19 + TanStack Router (file-based) + Convex backend + Tailwind 4. Runtime and package manager: bun.

Detailed rules live in `.claude/rules/` and load when you touch matching files. Cross-cutting changes should read both `convex.md` and `react.md`.

Docs, read when relevant:

- `docs/contributing.md`: branches, commits, PR process, what to disclose.
- `docs/local-dev.md`: checks, e2e, the shared dev deployment, generated files.
- `docs/release.md`: how releases are cut.

## Checks

`bun run check` is format, lint, types and unit tests; run it before pushing. `bun run test:e2e` creates its own Convex preview deployment and needs only `CONVEX_DEPLOY_KEY` in the environment. `bun run ci` is both, and is exactly what CI runs.

## Invariants

- **Disclose the unusual**: a new dependency, a `.github/` or `.claude/` change, or a regenerated file gets its own line in the PR's **Notes for reviewer** saying why.
- **Error handling in UI**: wrap every awaited Convex mutation/action call in `tryCatch` from `utils/try-catch`; on error, `Sentry.captureException(error)`, surface `error.message` via `useToast`, then early-return. Navigate/update state only on success. Never bare try/catch, never fire-and-forget mutations. The one exception is anonymous sign-in, where nothing can render without an identity, so the error state replaces the toast.
- Import Sentry as a namespace (`import * as Sentry from "@sentry/react"`); it is initialized only in `services/sentry`.
- Server-side authz **throws** — see `.claude/rules/convex.md` for the contract and the single exception.
- The server's `session.status` decides which screen renders. Clients never navigate between game phases.

## Git

- `type(scope): summary`, type = any Conventional Commits type, scope = area touched. PR titles too.
- Branches: `<issue#>/<slug>`. Commits and PR titles carry the type, not the branch.
- Fill every section of the PR template. `Closes #<issue>` goes in the PR **description**, one line per ticket.
- Never add a `Claude-Session` trailer to commits or a session link to PR bodies.
