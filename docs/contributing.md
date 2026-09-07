# Contributing

How a change gets from a branch to `main`. `CLAUDE.md` carries the one-line
versions of these rules; this is the reasoning behind them.

## Branches

- Human work: `seery/<topic>`.
- Agent work: `agent/<issue#>-<slug>`. These branches are opened by an agent
  pipeline that polls the project board and runs on a machine outside this
  repo; it implements one Ready ticket per run and opens a PR. It never
  merges, and every PR it opens is read by a person like any other.

Provenance lives in the branch name and the `Co-Authored-By` trailer, never in
the commit scope. That keeps `git log` readable by area and still answers "who
wrote this" from the PR. Never add a `Claude-Session` trailer to commits or a
session link to PR bodies.

## Commits and PR titles

Conventional Commits: `type(scope): summary`, type is one of `feat`, `fix`,
`chore`, `ci`. The scope is the area touched (`convex`, `lobby`, `round`,
`session`, `ci`, `deps`, `rules`), never the author or the issue number. PR
titles use the same format; `pr-title.yml` rejects anything else, and the
release tooling reads the type to decide the version bump and changelog
section (see `release.md`).

## Before asking for review

- Rebase onto the PR's base. `git log --oneline <base>..HEAD` must show only
  this PR's commits.
- Run the four checks and, for anything touching the app, the e2e suite (see
  `local-dev.md`). CI enforces the checks; say in the PR what you ran.
- Fill every section of `.github/pull_request_template.md`: Summary, Changes,
  Verification, Notes for reviewer. A human reads every PR; the template exists
  so the surprising parts are easy to find.

## Notes for reviewer: disclose the unusual

Anything a reviewer would not expect gets its own line under **Notes for
reviewer** saying why:

- a new dependency,
- a change under `.github/**` or `.claude/**` (rules, workflows, CODEOWNERS),
- a regenerated file (`src/routeTree.gen.ts`, `convex/_generated/**`),
- a design token added to `src/index.css`,
- a test that was changed rather than added.

## Closing tickets

Every PR that resolves a ticket carries `Closes #<issue>` in its
**description**, one line per ticket. Commit-message keywords are not enough:
`main` accepts only squash and rebase merges, and after either the body
keyword is the reliable auto-close path.

## Merging

Squash or rebase only, into `main`, through the merge queue. The queue re-runs
`checks` and `e2e` on its temporary branch, which is also how the release PR
gets validated (see `release.md`).
