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
| you | `mise run checks` |

`mise.toml` defines the tasks — `checks`, `dev`, `e2e`, `gate` — and they call
these scripts rather than replacing them. One name means the same thing to a
person, to CI and to an agent; `mise tasks` lists them.

Ignore lists live in `.oxfmtrc.json` and `.oxlintrc.json` (`ignorePatterns`,
one per tool, which is what oxc's docs recommend; there is no shared file).
`docs/**` is ignored by both.

`test` runs with `--coverage`, which prints the per-file table. The floor that
turns a coverage drop into a failure is the `[test] coverageThreshold` in
`bunfig.toml`, set just under the real number so it ratchets up rather than
blocking. Run `bun run test`, not bare `bun test`, or the floor is skipped.

## E2E

`mise run e2e` provisions its own backend and runs Playwright against it: it
creates a Convex preview deployment named after the current branch, mints a
`TEST_SECRET` and an auth keypair for the run, builds the bundle against the
new deployment's URL, and serves that build. It reads no `.env.local` — the
values are passed to Playwright as environment for that one command.

The only thing it needs is `CONVEX_DEPLOY_KEY` in the environment, a preview
deploy key from the Convex dashboard. It fails immediately and says so when
that is missing.

Server state is seeded and cleared through the HTTP helpers in
`playwright/helpers/convex.ts`, never through the UI.

Two settings in `playwright.config.ts` matter when reading results:

- `retries: 1` locally, `0` in CI. Locally a spec that fails once and passes on
  retry is reported as **flaky** and the run is green, so read the "flaky" line
  rather than the exit code (or use `--retries 0` for the real failure rate).
  In CI that same spec is a plain failure and fails the job.
- The suite always serves the built bundle, never `bun run dev`, and never
  reuses a running server. The backend URL is baked in at build time by the
  deploy that created the preview, so a dev server reading `.env.local` would
  talk to a different deployment than the one the run just provisioned. The
  port is chosen free per run, so a run collides with neither your dev server
  nor another checkout.

Agent sandboxes usually cannot bind `:5173` (`listen EPERM`), so the
pipeline's implement agent cannot run this suite.

## Which backend the suite runs against

One recipe. Every e2e run gets its own Convex preview deployment, named after
whatever it is running for: `ci.yml`'s `e2e` job takes `pr-<n>` on a pull
request, `mg-<sha>` in the merge queue and `main` post-merge; the pipeline
takes `agent-<issue>`; a checkout takes its branch name. Two runs never share a
backend. `convex deploy --preview-create <name>` replaces the deployment of
that name, so a re-run reuses its own and nobody else's, and the preview is
thrown away with the branch.

The only credential involved is a preview deploy key (`CONVEX_DEPLOY_KEY`),
which can create preview deployments and set env vars on them and nothing
else — it cannot reach prod or a dev deployment. Each run mints its own
`TEST_SECRET` and auth keypair (`scripts/generate-test-keys.mjs`) and sets
`OPTIONS_FIXTURES=1`, so the suite stores no long-lived secret.

Convex expires previews five days after creation, so there is nothing to clean
up and no cron to run.

## The dev deployment is shared

`bun run convex:dev` and `bunx convex dev --once` push the **current branch's**
functions and schema to the one dev deployment named in `.env.local`. That is
the dev loop: one deployment for every branch you check out. The e2e suite no
longer touches it — it runs on its own preview — so the rows it used to leave
behind are no longer a source of schema push failures.
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
