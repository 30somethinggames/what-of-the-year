import { expect, test } from "@playwright/test";

import { addPlayer } from "./helpers/convex";

test("kick: host kicks a player from the game sidebar", async ({ page }) => {
  await page.goto("/");

  // Home → Setup → Lobby
  await page.getByTestId("home-start").click();
  await page.getByTestId("name-input").pressSequentially("Host");
  await page.getByTestId("setup-submit").click();

  const sessionId = await page.locator('[data-testid="session-id"]').getAttribute("data-value");
  if (!sessionId) throw new Error("Could not read session ID");

  await addPlayer({ sessionId, name: "Player 2", avatar: "🎮" });
  await addPlayer({ sessionId, name: "Player 3", avatar: "🎲" });

  await expect(page.getByText("Player 2")).toBeVisible();
  await expect(page.getByText("Player 3")).toBeVisible();

  // Start game
  await page.getByTestId("lobby-start").click();
  await expect(page.getByText("Round 10")).toBeVisible();

  // Open sidebar
  await page.getByTestId("settings-button").click();
  await expect(page.getByTestId("sidebar-title")).toBeVisible();

  // Both players visible
  await expect(page.getByText("Player 2")).toBeVisible();
  await expect(page.getByText("Player 3")).toBeVisible();

  // Kick Player 2
  const player2Row = page.getByText("Player 2").locator("..");
  await player2Row.getByTestId("kick-player").click();

  // Player 2 gone, Player 3 still there
  await expect(page.getByText("Player 2")).not.toBeVisible();
  await expect(page.getByText("Player 3")).toBeVisible();

  // Close sidebar
  await page.getByTestId("close-sidebar").click();
  await expect(page.getByTestId("sidebar-title")).not.toBeVisible();
});
