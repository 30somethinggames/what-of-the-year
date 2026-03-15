import { expect, test } from "@playwright/test";

import { cleanup } from "./helpers/convex";

test.beforeAll(async () => {
  await cleanup();
});

test("smoke: home → setup → lobby → round → settings", async ({ page }) => {
  await page.goto("/");

  // Home Screen
  await expect(page.getByTestId("topic-picker")).toBeVisible();
  await expect(page.getByTestId("year-picker")).toBeVisible();
  await expect(page.getByTestId("home-start")).toBeVisible();

  // → Setup Screen
  await page.getByTestId("home-start").click();
  await expect(page.getByTestId("random-avatar")).toBeVisible();
  await expect(page.getByTestId("name-input")).toBeVisible();
  await expect(page.getByTestId("setup-submit")).toBeVisible();
  await expect(page.getByText("Game of 2026")).toBeVisible();

  await page.getByTestId("name-input").pressSequentially("Test User");
  await page.getByTestId("setup-submit").click();

  // → Lobby Screen
  await expect(page.getByTestId("invite")).toBeVisible();
  await expect(page.getByTestId("lobby-start")).toBeVisible();

  await page.getByTestId("lobby-start").click();

  // → Round Screen
  await expect(page.getByTestId("round-title")).toBeVisible();
  await expect(page.getByTestId("settings-button")).toBeVisible();

  // → Settings Screen
  await page.getByTestId("settings-button").click();
  await expect(page.getByTestId("settings-title")).toBeVisible();
  await expect(page.getByTestId("leave-game")).toBeVisible();
  await expect(page.getByTestId("close-settings")).toBeVisible();
});
