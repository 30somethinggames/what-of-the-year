# Sentry Integration

Add error tracking, performance monitoring, and source maps via Sentry.

## Prerequisites

1. Create a free Sentry account at sentry.io
2. Create a new React project in Sentry
3. Copy the DSN from the project settings

## 1. Install

```bash
bun add @sentry/react
```

## 2. Sentry Init Module

Create `src/utils/sentry.ts`:

- `Sentry.init()` with DSN from `import.meta.env.VITE_SENTRY_DSN`
- Guard: skip init if DSN is not set
- Enable performance monitoring (`tracesSampleRate`)
- Set environment from `import.meta.env.MODE`
- Integrate with TanStack Router for route-based performance tracing

## 3. Import in Entry Point

Add a side-effect import at the top of `src/main.tsx`:

```ts
import "utils/sentry";
```

Must be the first import so Sentry initializes before anything else.

## 4. Error Boundary

Wrap app content in `src/routes/__root.tsx` with `Sentry.ErrorBoundary`, using the existing `Error` component (`components/states/error.tsx`) as fallback. Wire retry to `window.location.reload()`.

## 5. Capture Mutation Errors

Add `Sentry.captureException` to all mutation catch blocks:

- `src/screens/round/round.tsx` — existing try/catch in `onEnter`
- `src/screens/topic/topic.tsx` — existing try/catch in join/create
- `src/screens/lobby/lobby.tsx` — add try/catch around mutations
- `src/components/sidebar/sidebar.tsx` — add try/catch around advanceRound, endSession, kickFromGame

## 6. Environment Variables

Add to `.env`:

```
VITE_SENTRY_DSN=<your-sentry-dsn>
```

Sentry only initializes when the DSN is set. No DSN = no Sentry (safe for local dev without noise).

## 7. Source Map Uploads

After the basic integration is working:

1. Install the Vite plugin:
   ```bash
   bun add -d @sentry/vite-plugin
   ```

2. Add to `vite.config.ts`:
   ```ts
   import { sentryVitePlugin } from "@sentry/vite-plugin";

   export default defineConfig({
     build: {
       sourcemap: true,
     },
     plugins: [
       // ... existing plugins
       sentryVitePlugin({
         org: process.env.SENTRY_ORG,
         project: process.env.SENTRY_PROJECT,
         authToken: process.env.SENTRY_AUTH_TOKEN,
       }),
     ],
   });
   ```

3. Add GitHub secrets for the deploy workflow:
   - `SENTRY_AUTH_TOKEN` — create at sentry.io/settings/auth-tokens
   - `SENTRY_ORG` — your Sentry org slug
   - `SENTRY_PROJECT` — your Sentry project slug

4. Add env vars to the build step in `.github/workflows/deploy.yml`:
   ```yaml
   - name: Build
     env:
       VITE_CONVEX_URL: ${{ secrets.VITE_CONVEX_URL }}
       SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
       SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
       SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
     run: bun run build
   ```

## Verification

- `bun run build` passes
- `bun run check:types` and `bun run check:lint` pass
- With DSN set locally, `Sentry.init` runs without errors in console
- Without DSN, app works normally with no Sentry noise
- After source map setup: errors in Sentry dashboard show readable stack traces
