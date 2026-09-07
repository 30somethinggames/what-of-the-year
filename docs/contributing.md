# Contributing

How a change gets from a branch to `main`. `CLAUDE.md` carries the one-line
versions of these rules; this is the reasoning behind them.

## Branches

`<issue#>/<slug>`, one branch per ticket:

    187/e2e-provisions-its-own-preview
    189/guest-sees-wrong-toast
    190/rename-scripts

The number is the ticket the branch closes, so a branch points at the reason it
exists and every branch groups under its issue. Nothing else belongs in the
name: not who wrote it, not what wrote it, not what kind of change it is — the
commits say that, in Conventional Commits form, and so does the PR title.
Provenance lives in the `Co-Authored-By` trailer, and every PR is read and
merged by a person regardless. Never add a `Claude-Session` trailer to commits
or a session link to PR bodies.

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

## CI and third-party actions

This repo's Actions policy is `selected`: GitHub-owned actions, plus
`oven-sh/setup-bun`, `googleapis/release-please-action` and
`anthropics/claude-code-action`, all pinned to a full commit SHA. Anything else
fails before the job starts, with a message naming the action.

Adding to that list widens the supply chain that can write to this repo, so the
answer is usually to do the work in a `run:` step instead. `ci.yml` reads the
pinned bun version out of `mise.toml` with `sed` for exactly this reason —
`jdx/mise-action` would have been one line, and one more vendor.

Third-party actions are also why a pinned SHA is required rather than a tag: a
tag can be moved to point at different code.

## Closing tickets

Every PR that resolves a ticket carries `Closes #<issue>` in its
**description**, one line per ticket. Commit-message keywords are not enough:
`main` accepts only squash and rebase merges, and after either the body
keyword is the reliable auto-close path.

## Merging

Squash or rebase only, into `main`, through the merge queue. The queue re-runs
`checks` and `e2e` on its temporary branch, which is also how the release PR
gets validated (see `release.md`).
