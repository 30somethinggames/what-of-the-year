import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",
  testMatch: "*.e2e.ts",
  fullyParallel: true,
  workers: process.env.CI ? 4 : 1,
  retries: 1,
  reporter: process.env.CI ? "list" : "list",
  timeout: 30_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: process.env.CI ? "http://localhost:4173" : "http://localhost:5173",
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
    command: process.env.CI ? "bun run preview" : "bun run dev",
    url: process.env.CI ? "http://localhost:4173" : "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
