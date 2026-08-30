## Get started

1. Request access to the Convex team from a project admin
2. Create `.env.local` with the following variables:

   ```bash
   CONVEX_DEPLOYMENT=dev:<your-deployment-slug>
   VITE_CONVEX_URL=https://<your-deployment-slug>.convex.cloud
   CONVEX_SITE_URL=https://<your-deployment-slug>.convex.site
   TEST_SECRET=<run: openssl rand -hex 32>
   ```
- Run `bunx convex dev` to create your dev deployment and get the slug
- Generate `TEST_SECRET` with `openssl rand -hex 32`, then set it on the deployment: `bunx convex env set TEST_SECRET <value>`

3. Install dependencies

   ```bash
   bun i
   ```

4. Start the Convex dev server (creates your personal dev deployment)

   ```bash
   bunx convex dev
   ```

5. Start the app

   ```bash
   bun dev
   ```

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
