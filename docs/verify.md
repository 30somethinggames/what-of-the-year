# Verifying a change on camera

How to show a change working: drive the built app in a browser and record it,
then embed each clip under **Verification** in the PR body. The reader watches
the change happen instead of taking a task list on trust.

This is for whoever wrote the change, agent or person. It is not the e2e suite:
the suite proves the app still works, this proves the change does what the
ticket asked.

## Stand the app up

`mise run serve` creates a Convex preview deployment named for the branch,
mints the run's secrets, builds the bundle against that deployment and serves
it. It prints one line, `URL=http://localhost:<port>`, once the app answers,
then stays up until killed.

It needs `CONVEX_DEPLOY_KEY` in `.env.local` and nothing else — the same key
`mise run test:e2e` uses, and the same provisioning, in `scripts/provision.ts`.
See [local-dev.md](local-dev.md) for where the key comes from.

What is served talks to the branch's own preview deployment, never to the
shared dev one, so a session created while recording appears in that
deployment's dashboard.

## The browser

`.mcp.json` runs [Playwright MCP](https://playwright.dev/mcp) headless, with
`--output-dir proof/`. `.claude/settings.json` enables it, so a session in this
checkout has the browser without being asked. The tools to know:

| tool | what it does |
| --- | --- |
| `browser_navigate` | opens the URL `mise run serve` printed |
| `browser_start_video` | starts recording; `filename` is where the WebM lands |
| `browser_video_show_actions` | annotates each action, with a cursor, in the clip |
| `browser_stop_video` | ends the recording and writes the file |
| `browser_take_screenshot` | one PNG, for a change with nothing to animate |

Playwright MCP pins its own browser build, newer than the e2e suite's. Install
it once per machine:

```sh
bunx playwright-core install chromium
```

## What to record

One file per acceptance criterion you exercised, named for the criterion, in
`proof/` — which is gitignored, because these are PR attachments and not
repository history.

- `proof/<criterion-slug>.webm` for anything with motion: a screen changing, a
  timer, a toast.
- `proof/<criterion-slug>.png` where nothing moves.
- Keep each file under 10 MB. A clip of one criterion is seconds long; when one
  runs large, record less of it rather than compressing it.

A change a player cannot see — a Convex guard, a doc, a refactor — records
nothing. Say that under **Verification** and say how it was checked instead.

## Put it in the PR

Embed each file in the PR **description**, under **Verification**, and attach it
on the same command:

```sh
gh pr create --body-file body.md --attach proof/round-shows-picks.webm
gh pr edit --body-file body.md --attach proof/round-shows-picks.webm
```

The body references the local path, `![round shows picks](proof/round-shows-picks.webm)`,
and `gh` rewrites it to the uploaded asset. GitHub then plays the video inline
in the description. A clip in a comment does not count: the description is what
a reader sees first and what survives a re-read.
