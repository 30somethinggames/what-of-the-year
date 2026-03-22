# Deploy to Cloudflare Pages with Custom Domain

Host the Expo web app on Cloudflare Pages (free tier) and connect a custom domain from Namecheap.

The Convex backend is already hosted — only the static frontend needs deployment.

## Code Changes

### 1. Add build script to `package.json`

```json
"build:web": "expo export --platform web"
```

Expo static export outputs to `dist/` (already in `.gitignore`).

### 2. Create SPA routing fallback

Create `public/_redirects`:

```
/*    /index.html   200
```

Dynamic route segments (`[topic]`, `[sessionId]`, `[round]`) need client-side routing. This tells Cloudflare Pages to serve `index.html` for all paths, letting Expo Router handle routing in the browser. Expo copies `public/` contents into `dist/` during export.

### 3. Add deploy script to `package.json` (optional)

```json
"deploy": "bun run build:web && bunx wrangler pages deploy dist --project-name what-of-the-year"
```

## Cloudflare Pages Setup

1. Create a free Cloudflare account at cloudflare.com
2. Deploy via CLI (no git integration needed):
   ```bash
   bun run build:web
   bunx wrangler pages project create what-of-the-year
   bunx wrangler pages deploy dist
   ```
3. Set environment variable in Cloudflare Pages dashboard:
   - `EXPO_PUBLIC_CONVEX_URL` = your Convex deployment URL

## Connect Namecheap Domain

1. **Add domain to Cloudflare** (free plan) — Cloudflare gives you two nameservers
2. **Update nameservers at Namecheap:**
   - Namecheap > Domain List > your domain > Nameservers > Custom DNS
   - Enter the two Cloudflare nameservers
   - Wait for propagation (can take up to 48 hours, usually minutes)
3. **Add custom domain in Cloudflare Pages:**
   - Pages project > Custom domains > Add domain
   - Cloudflare auto-creates the DNS record and provisions free SSL

## Verification

1. `bun run build:web` — confirm `dist/` is generated with `index.html`
2. `bunx wrangler pages deploy dist` — confirm deploy succeeds and `.pages.dev` URL works
3. Test deep links like `/movies/2026` directly in the browser (not just `/`)
4. Confirm Convex connection works (real-time updates load)
