# Deploy to Cloudflare Pages

Host the Vite frontend on Cloudflare Pages (free tier) with auto-deploy on merge to main.

The Convex backend is already hosted — only the static frontend needs deployment.

## 1. Code Changes

### SPA routing fallback

`public/_redirects` contains:

```
/*    /index.html   200
```

TanStack Router handles all routing client-side. This tells Cloudflare Pages to serve `index.html` for every path, so direct URLs like `/games/2026/abc123/10` don't 404. Vite copies `public/` into `dist/` during build.

### Build

```bash
bun run build
```

Outputs static files to `dist/`.

## 2. First Deploy

1. Create a free Cloudflare account at cloudflare.com
2. Deploy via CLI:
   ```bash
   bunx wrangler pages project create what-of-the-year
   VITE_CONVEX_URL=<your-convex-url> bun run build
   bunx wrangler pages deploy dist --project-name what-of-the-year
   ```

## 3. Environment Variables

Set in the Cloudflare Pages dashboard (Settings > Environment variables):

- `VITE_CONVEX_URL` — your Convex deployment URL

## 4. CI Auto-Deploy

`.github/workflows/deploy.yml` runs on every push to `main`:

1. Checks (format, lint, types, unit tests)
2. Builds with `VITE_CONVEX_URL`
3. Deploys to Cloudflare Pages
4. Creates a git tag (e.g. `deploy-2026-04-11-abc1234`)

### Required GitHub Secrets

- `VITE_CONVEX_URL` — Convex deployment URL
- `CLOUDFLARE_API_TOKEN` — create at cloudflare.com/profile/api-tokens (use the "Cloudflare Pages — Edit" template)
- `CLOUDFLARE_ACCOUNT_ID` — found in the Cloudflare dashboard sidebar

## 5. Rollback

`.github/workflows/rollback.yml` is a manual dispatch workflow. To rollback to a previous deploy:

**Via GitHub UI:**
Actions > Rollback > Run workflow > enter the deploy tag

**Via CLI:**
```bash
gh workflow run rollback.yml -f tag=deploy-2026-04-11-abc1234
```

List available deploy tags:
```bash
git tag -l "deploy-*" --sort=-creatordate
```

## 6. Connect whatoftheyear.com

1. **Add domain to Cloudflare** (free plan) — Cloudflare gives you two nameservers
2. **Update nameservers at Namecheap:**
   - Namecheap > Domain List > whatoftheyear.com > Nameservers > Custom DNS
   - Enter the two Cloudflare nameservers
   - Wait for propagation (can take up to 48 hours, usually minutes)
3. **Add custom domain in Cloudflare Pages:**
   - Pages project > Custom domains > Add domain > `whatoftheyear.com`
   - Cloudflare auto-creates the DNS record and provisions free SSL

## 7. Verification

1. `bun run build` — confirm `dist/` contains `index.html` and `_redirects`
2. Deploy succeeds and the `.pages.dev` URL works
3. Test deep links like `whatoftheyear.com/games/2026` directly in the browser
4. Confirm Convex connection works (real-time updates load)
