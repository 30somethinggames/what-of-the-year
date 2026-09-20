# Verifying a change on camera

A PR here shows its change working, in the description, under **Verification**:
for each acceptance criterion a player would notice, a short video or a
screenshot of the built app doing it, recorded by whoever made the change. This
is the recipe. The rule that a PR must carry it is in `contributing.md`.

## Stand the app up

    mise run serve

It provisions this branch's own Convex preview deployment, builds the bundle
against it, serves the build, and prints five lines once the app answers:

    URL=http://localhost:<port>
    preview=<name>
    CONVEX_URL=https://<slug>.convex.cloud
    CONVEX_SITE_URL=https://<slug>.convex.site
    TEST_SECRET=<hex>

It stays up until killed. It needs `CONVEX_DEPLOY_KEY` in `.env.local`, like
the e2e suite, and nothing else. The secret and the site URL are this run's:
they let you seed a phase through the `/test/*` routes instead of clicking
through ten rounds. `playwright/helpers/convex.ts` shows the calls.

## Record

The repo declares a headless Chrome for agents in `.mcp.json` (Playwright MCP,
approved for this project in `.claude/settings.json`). It writes to `proof/`,
which is gitignored. A person can use any browser and screen recorder; the
files are what matter.

For each acceptance criterion the change touches:

1. Seed or navigate to the state the criterion starts from.
2. Start recording (`browser_start_video`), do the thing the criterion
   describes, stop (`browser_stop_video`). A criterion where nothing moves is a
   screenshot instead.
3. Name the file for the criterion: `proof/<criterion-slug>.webm` or `.png`.
   Under 10 MB each; GitHub will not render more. A long clip is a short clip
   plus a screenshot of the end state.

A change a player cannot see — a Convex guard, a doc, a CI job — records
nothing, and Verification says so in one line.

## Put it in the PR

Reference each file from the PR body, under **Verification**, in the criteria's
order, and attach the files on the same command so GitHub rewrites the paths.
The path in the body must match the `--attach` argument exactly. A video has
no alt text and must be the only thing in its paragraph, so the criterion goes
on the line above it; a screenshot carries the criterion as its alt text:

    Given a lobby with two guests, when the host leaves, then both see the closed toast.

    ![](proof/host-leaves.webm)

    ![Given the game is over, then the results list every pick](proof/results.png)

    gh pr create --body-file body.md --attach proof/host-leaves.webm --attach proof/results.png
    gh pr edit <n> --body-file body.md --attach proof/host-leaves.webm

`--attach` needs GitHub CLI 2.99 or later and a user login (`gh auth login`);
an Actions token is refused. The media goes in the description, not a
comment: the description is what a reader opens, and the proof is the author's
own account of the change. The task list follows the media, for whatever a
recording cannot show.
