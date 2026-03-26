import { expect, test } from "@playwright/test";

import { cleanup } from "./helpers/convex";

test.beforeAll(async () => {
  await cleanup();
});

test("error: invalid session ID shows error or join form", async ({ page }) => {
  await page.goto("/games/2026/invalid-session-id");

  // Page should load without crashing — either error state or join form renders
  await expect(
    page.getByText("Something went wrong").or(page.getByTestId("name-input")),
  ).toBeVisible({ timeout: 15000 });
});

test("error: nonexistent session ID shows error or join form", async ({ page }) => {
  // Use a plausible but nonexistent ID
  await page.goto("/games/2026/j57d9pf2p0vabcdefgh1234");

  await expect(
    page.getByText("Something went wrong").or(page.getByTestId("name-input")),
  ).toBeVisible({ timeout: 15000 });
});
