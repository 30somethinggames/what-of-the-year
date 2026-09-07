## Get started

1. Request access to the Convex team from a project admin.
2. Install [mise](https://mise.jdx.dev) and the toolchain:

   ```bash
   mise install && bun i
   ```

3. Start the app. `convex dev` creates your personal dev deployment on first
   run and writes `.env.local` itself — there is nothing to fill in by hand.

   ```bash
   bunx convex dev   # in one terminal
   mise run dev      # in another
   ```

## Running the tests

```bash
mise run checks   # format, lint, types, unit
mise run e2e      # Playwright, against a preview deployment it creates
mise run gate     # both, exactly what CI runs on a PR
```

`e2e` needs a Convex **preview deploy key** exported as `CONVEX_DEPLOY_KEY` —
mint one in the Convex dashboard under project settings. It can only create
preview deployments and set env vars on them; it cannot reach prod or anyone's
dev deployment.

Each run deploys to a preview named after your current branch — or the short
commit, in a detached checkout — and mints its own `TEST_SECRET` and auth
keypair. Two runs collide only on the same branch of the same repo; set
`PREVIEW_NAME` on one of them if that happens. Convex expires previews after five days. Nothing is written to
`.env.local` and nothing needs to be.

## Production deployment

The prod deployment must never run the nightly reset cron, expose the `/test/*` seeding routes, or serve fixture options. All three are gated on `IS_PROD` (presence-only — any non-empty value, even `false`, counts as prod).

Convex evaluates the cron and HTTP route gates at deploy time, so **set the flag before the first deploy** that includes this code:

```bash
bunx convex env set IS_PROD true --prod
```

Before every prod deploy, confirm no test switches are set:

```bash
bunx convex env list --prod   # must NOT list TEST_SECRET or OPTIONS_FIXTURES
```
