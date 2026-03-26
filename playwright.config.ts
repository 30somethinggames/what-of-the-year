import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  globalSetup: "./playwright/global-setup.ts",
  testDir: "./playwright",
  testMatch: "*.e2e.ts",
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 4 : 1,
  retries: 1,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  timeout: 30_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
