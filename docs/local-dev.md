# Local development

What runs where, and the things about the local setup that are not obvious
from the code. What the app you are running actually does, phase by phase and
rule by rule, is `game.md`.

## The backend seam

Everything that reaches a server is in five places, and nothing else in `src/`
imports a backend's client. Replacing the backend is rewriting these; the
screens do not change.

| path | what it is |
| --- | --- |
| `convex/` | the server: schema, queries, mutations, actions |
| `src/main.tsx` | the client entry, and the provider the app is wrapped in |
| `src/hooks/use-anonymous-auth.ts` | sign-in, and the identity every call carries |
| `src/db/*.ts` | a hook per session, player, round and selection call |
| `src/queries/use-*.ts` | the option lists a topic and year offers |

What those hooks owe the screens is `src/types/backend.ts`, which states the
contract and sits outside the seam.

## Checks

The toolchain is pinned in `mise.toml`: install [mise](https://mise.jdx.dev),
then `mise install` before `bun install`. Bun is the runtime; the node pin is
there only because Playwright will not load our specs under bun (see
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
blocking. Run `mise run test`, not bare `bun test`: the floor applies only
under `--coverage`, which the task passes.

## E2E

`mise run test:e2e` provisions its own backend and runs Playwright against it: it
creates a Convex preview deployment named after the current branch, mints a
`TEST_SECRET` and an auth keypair for the run, builds the bundle against the
new deployment's URL, and serves that build. It takes no deployment settings
from `.env.local`; everything the suite talks to is created by the run and
passed to Playwright as environment for that one command.

The suite runs in two Playwright projects, both against the one preview
deployment the run creates:

| project | device | what it covers |
| --- | --- | --- |
| `chromium` | `Desktop Chrome`, 1280×720 | every spec |
| `mobile` | `Pixel 7` Chromium, 412×839 | `playwright/game/**` and the `@smoke` journeys |

`mobile` is the repo's layout test: a phone is the real client for a game
passed around a room, and a component or visual layer would not catch a
Tailwind `@layer` regression anyway. It skips the pregame specs, whose subject
is validation rather than layout. Run one with `--project`: `mise run test:e2e
-- --project mobile`.

`mise run test:e2e:smoke` runs the same thing over the three journey specs
only — `pregame/smoke`, `game/single-player`, `game/multiplayer`, the ones
tagged `@smoke` — in both projects. That is the subset for the loop while
working; before a PR run the whole suite, and CI runs everything regardless.
It is a task rather than something you remember because the tag is ours, not
Playwright's, and `mise tasks` is where this repo says what there is to run.
Arguments reach Playwright either way, so any other slice is a flag: `mise run
test:e2e -- --grep @smoke` is exactly what the task runs, and `-- --ui` or
`-- --retries 0` work the same.

The one thing it needs is `CONVEX_DEPLOY_KEY`, a preview deploy key from the
Convex dashboard. Keep it in `.env.local`: bun loads that file automatically, so
a checkout needs no exporting and no shell setup. The script fails immediately
and says so when the key is missing.

The deploy regenerates `convex/_generated`, so straight after it the script
checks that the result matches what is committed and stops the run when it does
not. It has to be here: `convex codegen` needs a live deployment, and this is
the only command that has one.

Server state is seeded and cleared through the HTTP helpers in
`playwright/helpers/convex.ts`, never through the UI. What those routes are is
the next section.

Two settings in `playwright.config.ts` matter when reading results:

- `retries: 1` locally, `0` in CI. Locally a spec that fails once and passes on
  retry is reported as **flaky** and the run is green, so read the "flaky" line
  rather than the exit code (or use `--retries 0` for the real failure rate).
  In CI that same spec is a plain failure and fails the job.
- The suite always serves the built bundle, never `mise run dev`, and never
  reuses a running server. The backend URL is baked in at build time by the
  deploy that created the preview, so a dev server reading `.env.local` would
  talk to a different deployment than the one the run just provisioned. The
  port is chosen free per run, so a run collides with neither your dev server
  nor another checkout.

Run `mise run test:e2e` before you open the PR; CI runs it either way.

### Inside the Claude Code sandbox

The sandbox sends egress through a proxy named in `HTTPS_PROXY`. Playwright is run with `NODE_USE_ENV_PROXY=1`, so node's `fetch` — the `/test/*` helpers and the global setup — honours it, and Chromium is launched with that proxy and `localhost`, `127.0.0.1` bypassed, so the preview server is still reached directly. Both are no-ops when no proxy variable is set, which is how CI runs.

Two things are the session's, not the repo's, and stay in the user's own settings: `sandbox.network.allowLocalBinding`, because the port probe and `vite preview` listen on `127.0.0.1`, and allowing the hosts a run reaches — `api.convex.dev`, `*.convex.cloud` and `*.convex.site`. With those set the task needs no `excludedCommands` entry.

## Test routes

The five `POST` routes a spec seeds through. `convex/http.ts` registers them,
`convex/test/http.ts` wraps them and `convex/test/seed.ts` holds the mutations;
`playwright/helpers/convex.ts` is the only client.

They are registered only when `testRoutesEnabled()` holds — `TEST_SECRET` set
on the deployment and `IS_PROD` unset — so prod serves none of them. Each
request carries that secret in an `x-test-secret` header and gets `401
Unauthorized` without it. The JSON body is checked by the mutation's own `args`
validators. A mutation that returns nothing answers `{ "ok": true }`.

The types below are those validators, `?` marking an optional field. `topic`
defaults to `games` and `year` to 2026. Rounds count down: a game starts at
`round:10` and ends at `round:1`.

### `/test/create-session`

| field | type | what it sets |
| --- | --- | --- |
| `name` | `string` | the host's display name |
| `topic` | `string?` | the session's topic |
| `year` | `number?` | the session's year |
| `avatar` | `string?` | the host's avatar, else one from the seed's list |
| `hostUid` | `string?` | the host's uid, else a generated `test-` one |

Answers `{ sessionId, hostUid }`. Leaves a `LOBBY` session on round 1, its one
player the host, and `MAX_ROUNDS` rounds all `pending`.

### `/test/seed-game`

| field | type | what it sets |
| --- | --- | --- |
| `phase` | `string` | `lobby`, `ended`, `round:<n>` or `revealing:<n>` |
| `players` | `{ name: string, avatar?: string, uid?: string }[]` | the roster, first entry the host |
| `selections` | `{ uid: string, roundNumber: number, pickName: string }[]?` | picks already made |
| `topic` | `string?` | the session's topic |
| `year` | `number?` | the session's year |

Answers `{ sessionId, roundIds, players }`, each player `{ uid, name, isHost }`.
Leaves the session at `phase` with `MAX_ROUNDS` rounds in the states it implies
and the selections inserted, each scored by its round. A `revealing:<n>` phase
also schedules the reveal job, so the round times out on its own.

Only a player with no `uid` gets a generated one. A browser's uid comes from
`signIn` in `playwright/helpers/convex.ts`, because a page can never adopt a
uid the seed invented.

### `/test/add-player`

| field | type | what it sets |
| --- | --- | --- |
| `sessionId` | `Id<"sessions">` | the session to join |
| `name` | `string` | the player's display name |
| `avatar` | `string` | the player's avatar |

Answers `{ uid }`. Leaves one more non-host player on the session and its
`playerCount` raised by one. Throws when the session is gone.

### `/test/make-selection`

| field | type | what it sets |
| --- | --- | --- |
| `sessionId` | `Id<"sessions">` | the session picked in |
| `uid` | `string` | whose pick it is |
| `roundNumber` | `number` | the round picked in |
| `pickName` | `string` | the pick, whose id is the slug of this |

Answers `{ ok: true }`. Leaves a selection scored by its round and the round's
`selectionsComplete` raised by one. When that reaches `playerCount` the round
closes, and above round 1 the next one opens and becomes the active round.
Throws when the round or the session is gone.

### `/test/cleanup`

Takes no body. Answers `{ ok: true }`. Empties `sessions`, `players`, `rounds`
and `selections`.

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
which can create preview deployments, set env vars on them and delete them, and
nothing else — it cannot reach prod or a dev deployment. Each run mints its own
`TEST_SECRET` and auth keypair and sets
`OPTIONS_FIXTURES=1`, so the suite stores no long-lived secret. CI holds the
same key as a repository secret and, because Dependabot reads its own store,
as a Dependabot secret too; a fork PR gets neither, so its `e2e` job fails
until the change is pushed from a branch in this repo.

The run deletes the deployment it created when it exits, pass or fail, so the
team's deployment quota holds no slot for a finished run. A failed delete is a
warning naming the slug and leaves the run's verdict alone. Convex expires
previews five days after creation, which is the backstop for a run that was
killed before it could tear down, so there is still no cron to run.

`E2E_KEEP_PREVIEW=1 mise run test:e2e` keeps the deployment and logs its name
and slug, for looking at the data a run left behind. It is off everywhere
otherwise, CI included.

## A local backend per checkout

`mise run backend` gives this checkout its own Convex backend: an **anonymous
local deployment**, a CLI-managed binary with its state under `.convex/`
(gitignored). No account, no key, no cost, and no way for a push to reach
anyone else's client. It is three stock commands: `convex dev --once` under
`CONVEX_AGENT_MODE=anonymous`, which creates the deployment, picks a free port
and writes the URLs into `.env.local`; the auth library's own setup, which
mints and sets the JWT keypair; and `convex env set OPTIONS_FIXTURES 1`, so
the pick autocomplete serves fixtures instead of calling APIs whose keys a
local deployment does not have. A cloud deployment named in the environment
rather than in this checkout's `.env.local` is ignored: Ronco runs the task in
a worktree with the root checkout's env file exported, and the CLI would
otherwise refuse the preview deploy key or push to the dev deployment. After that `bunx convex dev` and `mise run
dev` use it with no extra flags, the same two-terminal loop the README
describes. The backend process itself lives inside `convex dev` and stops with
it, so keep that terminal open while you work.

It is what a worktree develops against: an agent working a ticket, or you with
several branches checked out at once. Reach for it when you are changing
`convex/schema.ts` or a status literal and do not want the shared deployment
refusing the push or serving a half-migrated API to another client. Stay on
the cloud dev deployment for anything that needs a public URL: a phone, the
Convex dashboard. The local backend has neither.

`mise run backend:reset` throws the instance away and rebuilds it. That is the
way out of a push refused by rows an earlier run left behind. Both tasks
refuse to run when `.env.local` names a cloud deployment, so your own loop
cannot be replaced by accident. The seeding routes need `TEST_SECRET` on the
deployment and a push after it; set it yourself when you want them, the e2e
suite does the same on its preview.

Every local push regenerates `convex/_generated`, like every deploy does; the
committed files match what the CLI emits, and a diff there is a real CLI
change that belongs in your commit.

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
  version change and belongs in your commit, not restored away. `mise run
  test:e2e` stops when it does, so nothing lands stale.

## Generated files

- `src/routeTree.gen.ts` is written by the TanStack Router Vite plugin during
  `mise run dev` / `bun run build`. Regenerate it, never hand-edit it.
- `convex/_generated/**` is written by the Convex CLI. Commit it only when a
  function signature actually changed.

## Auth in development

Sign-in is anonymous and happens once in the `/$topic` layout via
`hooks/use-anonymous-auth`. Every `signIn("anonymous")` call mints a new user,
so never add a second call site; the hook's ref guard exists because
StrictMode double-invokes effects in dev and a second sign-in replaces the
first identity mid-flow (#155).
