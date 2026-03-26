import { expect, test } from "@playwright/test";

import { cleanup } from "./helpers/convex";

test.beforeAll(async () => {
  await cleanup();
});

test("sidebar: opens and closes via button and backdrop", async ({ page }) => {
  await page.goto("/");

  // Home → Setup → Lobby → Round
  await page.getByTestId("home-start").click();
  await page.getByTestId("name-input").pressSequentially("Host");
  await page.getByTestId("setup-submit").click();
  await expect(page.getByTestId("lobby-start")).toBeVisible();
  await page.getByTestId("lobby-start").click();
  await expect(page.getByText("Round 10")).toBeVisible();

  // Sidebar is closed initially
  await expect(page.getByTestId("sidebar-title")).not.toBeVisible();

  // Open sidebar via settings button
  await page.getByTestId("settings-button").click();
  await expect(page.getByTestId("sidebar-title")).toBeVisible();
  await expect(page.getByTestId("sidebar-title")).toContainText("Players");
  await expect(page.getByTestId("leave-game")).toBeVisible();
  await expect(page.getByTestId("advance-round")).toBeVisible();

  // Close via ✕ button
  await page.getByTestId("close-sidebar").click();
  await expect(page.getByTestId("sidebar-title")).not.toBeVisible();

  // Reopen sidebar
  await page.getByTestId("settings-button").click();
  await expect(page.getByTestId("sidebar-title")).toBeVisible();

  // Close via backdrop click
  const backdrop = page.locator(".fixed.inset-0.z-40");
  await backdrop.click({ position: { x: 350, y: 300 } });
  await expect(page.getByTestId("sidebar-title")).not.toBeVisible();
});
