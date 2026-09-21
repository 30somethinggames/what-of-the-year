# Running the app while you work, and showing it in the PR

A change a player would notice is developed with the app running, and its PR
shows it working: in the description, under **Verification**, a short video
or a screenshot per acceptance criterion, recorded by whoever made the change.
This is the recipe. The rule that a PR must carry it is in `contributing.md`.

## Have the app up

Once per checkout, a backend of its own:

    mise run backend

That is an anonymous local Convex deployment written into `.env.local`; see
`local-dev.md`. A worktree has no `.env.local` when it is created, so this is
the first thing to run in one. Your own checkout can keep its cloud dev
deployment instead; the task refuses to replace one.

Then the same two terminals the README describes:

    bunx convex dev    # runs the local backend and pushes convex/ on every save
    mise run dev       # Vite, hot reload, prints its URL

The backend is a subprocess of `convex dev`; close that terminal and the app
has no backend. Keep both running for the whole session.

Work with it open. A screen you never looked at is a screen you have not
verified. To seed a phase instead of clicking through ten rounds, set
`TEST_SECRET` on the deployment (`bunx convex env set TEST_SECRET <hex>`, then
a push), and use the `/test/*` routes the way `playwright/helpers/convex.ts`
does.

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
