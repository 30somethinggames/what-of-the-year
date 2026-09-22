import { expect, test } from "@playwright/test";
import { testIds } from "test-ids";

test("smoke: home → setup → lobby → round → settings", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/");

  // Home Screen
  await expect(page.getByTestId(testIds.picker.topic)).toBeVisible();
  await expect(page.getByTestId(testIds.picker.year)).toBeVisible();
  await expect(page.getByTestId(testIds.home.start)).toBeVisible();

  // → Setup Screen
  await page.getByTestId(testIds.home.start).click();
  await expect(page.getByTestId(testIds.topic.randomAvatar)).toBeVisible();
  await expect(page.getByTestId(testIds.topic.nameInput)).toBeVisible();
  await expect(page.getByTestId(testIds.topic.submit)).toBeVisible();
  await expect(page.getByText("Game of 2026")).toBeVisible();

  await page.getByTestId(testIds.topic.nameInput).pressSequentially("Test User");
  await expect(page.getByTestId(testIds.topic.submit)).toBeEnabled();
  await page.getByTestId(testIds.topic.submit).click();

  // → Lobby Screen
  await expect(page.getByTestId(testIds.lobby.invite)).toBeVisible();
  await expect(page.getByTestId(testIds.lobby.start)).toBeVisible();

  await page.getByTestId(testIds.lobby.start).click();

  // → Round Screen
  await expect(page.getByText("Round 10")).toBeVisible();
  await expect(page.getByTestId(testIds.settings.button)).toBeVisible();

  // → Sidebar
  await page.getByTestId(testIds.settings.button).click();
  await expect(page.getByTestId(testIds.sidebar.title)).toBeVisible();
  await expect(page.getByTestId(testIds.sidebar.leaveGame)).toBeVisible();
  await expect(page.getByTestId(testIds.sidebar.close)).toBeVisible();
});
