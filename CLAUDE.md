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

- **Disclose the unusual**: a new dependency, a CI or `.claude/` rules change, or a regenerated file gets its own line in the PR's **Notes for reviewer** saying why. A human reads every PR; make the surprising parts easy to find.
- **Error handling in UI**: wrap every awaited Convex mutation/action call in `tryCatch` from `utils/try-catch`; on error, `Sentry.captureException(error)`, surface `error.message` via `useToast`, then early-return. Navigate/update state only on success. Never bare try/catch, never fire-and-forget mutations.
- Import Sentry as a namespace (`import * as Sentry from "@sentry/react"`); it is initialized only in `services/sentry`.
- Server-side authz **throws** — see `.claude/rules/convex.md` for the contract and the single exception.

## Git

- Conventional Commits: `type(scope): summary`, type ∈ `feat|fix|chore|ci`. The scope is the area touched (`convex`, `lobby`, `round`, `ci`, `deps`, `rules`), never the author or the issue number. PR titles follow the same format.
- Branches: human work `seery/<topic>`, agent work `agent/<issue#>-<slug>`. Provenance lives in the branch name and the `Co-Authored-By` trailer, not the commit scope.
- Rebase onto the PR's base before pushing for review. `git log --oneline <base>..HEAD` shows only this PR's commits.
- PRs fill every section of `.github/pull_request_template.md` (Summary / Changes / Verification / Notes for reviewer) and merge to `main` via squash or rebase only.
- Never add a `Claude-Session` trailer to commits or a session link to PR bodies.
- Every PR that resolves a ticket carries `Closes #<issue>` in its **description** (not just a commit message — squash/rebase merges make the body keyword the reliable auto-close path). One line per ticket if a PR resolves several.
