# Local development

What runs where, and the things about the local setup that are not obvious
from the code.

## Checks

The toolchain is pinned in `mise.toml`: install [mise](https://mise.jdx.dev),
then `mise install` before `bun install`. Bun is the runtime; the node pin is
there only because Playwright's runner will not load our specs under bun (see
the comment in `mise.toml`), so it is needed for `bun run test:web` and nothing
else.

`package.json` defines four: `check:format` (oxfmt), `check:lint` (oxlint),
`check:types` (tsc), `test` (bun test). They run in three places:

| where | what |
| --- | --- |
| `.husky/pre-commit` | format + lint on staged files, then `check:types` |
| `ci.yml` `checks` job | all four, on every PR and merge-queue run |
| you | `bun run check:format && bun run check:lint && bun run check:types && bun run test` |

Ignore lists live in `.oxfmtrc.json` and `.oxlintrc.json` (`ignorePatterns`,
one per tool, which is what oxc's docs recommend; there is no shared file).
`docs/**` is ignored by both.

`test` runs with `--coverage`, which prints the per-file table. The floor that
turns a coverage drop into a failure is the `[test] coverageThreshold` in
`bunfig.toml`, set just under the real number so it ratchets up rather than
blocking. Run `bun run test`, not bare `bun test`, or the floor is skipped.

## E2E

`bun run test:web` runs Playwright against a Vite dev server on `:5173` and
needs `.env.local` (`CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, `CONVEX_SITE_URL`,
`TEST_SECRET`). Server state is seeded and cleared through the HTTP helpers
in `playwright/helpers/convex.ts`, never through the UI.

Two settings in `playwright.config.ts` matter when reading results:

- `retries: 1` locally, `0` in CI. Locally a spec that fails once and passes on
  retry is reported as **flaky** and the run is green, so read the "flaky" line
  rather than the exit code (or use `--retries 0` for the real failure rate).
  In CI that same spec is a plain failure and fails the job.
- `reuseExistingServer` locally, so a dev server you already have on `:5173`
  is used as is.

Agent sandboxes usually cannot bind `:5173` (`listen EPERM`), so the
pipeline's implement agent cannot run this suite. CI runs it against a
throwaway Docker Convex backend (`ci.yml` `e2e` job).

## The dev deployment is shared

`bun run convex:dev`, `bunx convex dev --once`, and by extension `test:web`
push the **current branch's** functions and schema to the one dev deployment
named in `.env.local`. There is no per-branch backend (#154 tracks that).
Consequences:

- Any other local client of that deployment, another worktree or `main`
  checked out elsewhere, is now on this branch's API.
- A schema change is **refused** while stored rows violate it
  (`Schema validation failed … Path: .status`). Rows from earlier e2e runs are
  the usual cause. Clear them with the suite's cleanup endpoint, then push
  again:

  ```sh
  set -a && source .env.local && set +a
  bun -e 'import { cleanup } from "./playwright/helpers/convex"; await cleanup()'
  bunx convex dev --once
  ```

- The local Convex CLI may rewrite `convex/_generated/server.d.ts` and
  `server.js` on every push (it adds an `env` export the committed files lack).
  That is CLI version drift, not part of your change; restore the files before
  committing:

  ```sh
  git restore --source=main convex/_generated
  ```

## Generated files

- `src/routeTree.gen.ts` is written by the TanStack Router Vite plugin during
  `bun run dev` / `bun run build`. Regenerate it, never hand-edit it.
- `convex/_generated/**` is written by the Convex CLI. Commit it only when a
  function signature actually changed.

## Auth in development

Sign-in is anonymous and happens once in the `/$topic` layout via
`hooks/use-anonymous-auth`. Every `signIn("anonymous")` call mints a new user,
so never add a second call site; the hook's ref guard exists because
StrictMode double-invokes effects in dev and a second sign-in replaces the
first identity mid-flow (#155).
