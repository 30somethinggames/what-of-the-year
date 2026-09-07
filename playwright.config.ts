import { defineConfig, devices } from "@playwright/test";

// `mise run e2e` picks a free port so two checkouts can run at once.
const port = process.env.E2E_PORT ?? "5173";

export default defineConfig({
  globalSetup: "./playwright/helpers/global-setup.ts",
  testDir: "./playwright",
  testMatch: "*.e2e.ts",
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 4 : 1,
  // A spec that only passes on retry is a failure in CI. Locally a retry still
  // absorbs a dev-machine hiccup and reports the spec as flaky.
  retries: process.env.CI ? 0 : 1,
  reporter: process.env.CI
    ? [["list"], ["github"], ["json", { outputFile: "test-results/results.json" }]]
    : "list",
  timeout: 30_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: `http://localhost:${port}`,
    // There is no retry in CI, so the trace has to come off the failure itself.
    trace: process.env.CI ? "retain-on-failure" : "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Always the built bundle, never the dev server. The backend URL is baked in
  // at build time by the deploy that created this run's preview, so a dev
  // server reading `.env.local` would talk to a different deployment than the
  // one the suite just provisioned. `mise run e2e` builds before it gets here.
  webServer: {
    // --strictPort: vite otherwise serves on port+1 when the probed port was
    // taken in between, and Playwright polls the wrong one until the 120s
    // timeout with nothing saying why.
    command: `bun run preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
