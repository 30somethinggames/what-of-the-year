# Local development

What runs where, and the things about the local setup that are not obvious
from the code.

## Checks

The toolchain is pinned in `mise.toml`: install [mise](https://mise.jdx.dev),
then `mise install` before `bun install`. Bun is the runtime; the node pin is
there only because Playwright's runner will not load our specs under bun (see
the comment in `mise.toml`), so it is needed for `mise run test:e2e` and nothing
else.

`mise.toml` defines four: `format` (oxfmt), `lint` (oxlint), `types` (tsc),
`test` (bun test). Each checks without changing anything; `format:fix`
and `lint:fix` are the counterparts that write. They run in three places:

| where | what |
| --- | --- |
| `.husky/pre-commit` | format + lint on staged files, then `types` |
| `ci.yml` `checks` job | all four, on every PR and merge-queue run |
| you | `mise run check` |

`mise run check` runs all four — in parallel, via `depends` — and `mise run ci`
adds the e2e suite. CI runs those two by name. `package.json` keeps only the scripts other tools call by name: `preview` for
Playwright's web server, `build` for the Convex deploy, `prepare` for husky.

Ignore lists live in `.oxfmtrc.json` and `.oxlintrc.json` (`ignorePatterns`,
one per tool, which is what oxc's docs recommend; there is no shared file).
`docs/**` is ignored by both.

`test` runs with `--coverage`, which prints the per-file table. The floor that
turns a coverage drop into a failure is the `[test] coverageThreshold` in
`bunfig.toml`, set just under the real number so it ratchets up rather than
blocking. Run `bun run test`, not bare `bun test`, or the floor is skipped.

## E2E

`mise run test:e2e` provisions its own backend and runs Playwright against it: it
creates a Convex preview deployment named after the current branch, mints a
`TEST_SECRET` and an auth keypair for the run, builds the bundle against the
new deployment's URL, and serves that build. It takes no deployment settings
from `.env.local`; everything the suite talks to is created by the run and
passed to Playwright as environment for that one command.

The one thing it needs is `CONVEX_DEPLOY_KEY`, a preview deploy key from the
Convex dashboard. Keep it in `.env.local`: bun loads that file automatically, so
a checkout needs no exporting and no shell setup. The script fails immediately
and says so when the key is missing.

After the suite the script checks that the deploy left `convex/_generated`
matching what is committed, and fails naming the directory when it did not —
the deploy is the only thing that regenerates those files, so this is the only
place the check can run.

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

A sandboxed environment often cannot bind a port (`listen EPERM`), so the suite
may not be runnable where a change is written. Run it before you open the PR;
CI runs it either way.

`package.json` declares `gate` — the four checks then the e2e suite — so that
what must pass before a PR is one named thing rather than something each caller
assembles for itself. `mise run ci` and CI both run it, and so does anything
else that gates this repo from outside it.

## Which backend the suite runs against

One recipe. Every e2e run gets its own Convex preview deployment, named after
whatever it is running for: `ci.yml`'s `e2e` job takes `pr-<n>` on a pull
request, `mg-<sha>` in the merge queue and `main` post-merge; a checkout takes
its branch name, or the short commit when the checkout is detached. Two runs
share a backend only if they are on the same branch of the same repo, in which
case set `PREVIEW_NAME` on one of them. `convex deploy --preview-create <name>` replaces the deployment of
that name, so a re-run reuses its own and nobody else's, and the preview is
thrown away with the branch.

The only credential involved is a preview deploy key (`CONVEX_DEPLOY_KEY`),
which can create preview deployments and set env vars on them and nothing
else — it cannot reach prod or a dev deployment. Each run mints its own
`TEST_SECRET` and auth keypair and sets
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

- Any other local client of that deployment — a second checkout, or `main`
  open elsewhere — is now on this branch's API.
- A schema change is **refused** while stored rows violate it
  (`Schema validation failed … Path: .status`). Rows from earlier e2e runs are
  the usual cause. Clear them with the suite's cleanup endpoint, then push
  again:

  ```sh
  set -a && source .env.local && set +a
  bun -e 'import { cleanup } from "./playwright/helpers/convex"; await cleanup()'
  bunx convex dev --once
  ```

- `convex/_generated/server.{d.ts,js}` are regenerated by any push or deploy,
  including every `mise run test:e2e`. The committed files now match what the CLI
  emits, so this should be a no-op; if a diff does appear it is a real CLI
  version change and belongs in your commit, not restored away. `bun run
  test:e2e` fails when it does, so the `e2e` job catches it drifting again.

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
