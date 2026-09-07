# Releases

We follow Conventional Commits but cut no releases by hand. A push-to-`main`
`Release` workflow (`.github/workflows/release-please.yml`) runs
[release-please](https://github.com/googleapis/release-please), which keeps a
standing release PR open. Merging that PR bumps `package.json`, writes
`CHANGELOG.md`, tags `v<version>` and cuts a GitHub release, so a deploy has a
version to point at and a rollback has a name. Nothing publishes to a
registry; the package stays private.

## Configuration

`release-please-config.json` (manifest mode, current version tracked in
`.release-please-manifest.json`):

| key | value | why |
| --- | --- | --- |
| `release-type` | `node` | bumps `package.json`; the package is `private`, so no registry publish |
| `include-component-in-tag` | `false` | plain `v0.1.0` tags. The `node` strategy derives the component from the package name, and the schema default is `true`, so dropping this line would produce `what-of-the-year-v0.1.0` |
| `pull-request-title-pattern` | `chore(release): v${version}` | matches the `type(scope)` PR title convention |
| `bootstrap-sha` | main's tip at adoption | there is no `v0.0.1` tag to anchor on; without it the first release PR replays ~150 commits of history. The first changelog entry starts at adoption and earlier `feat`/`fix` commits are not backfilled |
| `changelog-sections` | `feat`, `fix`, `ci` | every other type is hidden from the changelog on purpose; release-please still reads them, they just don't get a section. Which types deserve a heading is independent of which types a PR title may use |

Only `feat` and `fix` commits bump the version (`fix` → patch, `feat` → minor,
`!` / `BREAKING CHANGE` → major). `ci` and `chore` commits ride along in the
next release without triggering one.

## How the release PR is validated

The release PR is opened by the default `GITHUB_TOKEN`, and GitHub does not
fire `pull_request` events for PRs that token opens, so neither `ci.yml` nor
`pr-title.yml` runs on the PR itself. Validation is deferred, not skipped: the
`Protect main branch` ruleset requires a merge queue, and `ci.yml` triggers on
`merge_group`, so `checks` and `e2e` run against the queue's temporary branch
before the PR can land.

Giving the action a PAT or GitHub App token instead would move validation back
onto the PR. That is a repo-secret decision, not a code one, so it has not
been made here.

## Repo settings the workflow depends on

- **Settings > Actions > General > "Allow GitHub Actions to create and approve
  pull requests"** must be enabled, or `GITHUB_TOKEN` cannot open the release
  PR at all.
- The workflow's job permissions are `contents: write` (push the release
  branch, tag, create the release) and `pull-requests: write` (open and groom
  the release PR). Top-level permissions are empty.
- Concurrency group `release-please`, never cancelled: concurrent pushes to
  `main` would race the release PR, and a half-finished run can tag without
  creating the release.

## Generated files

`CHANGELOG.md` is written by release-please and listed in `ignorePatterns` in
both `.oxfmtrc.json` and `.oxlintrc.json`, so neither tool touches it.
