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
