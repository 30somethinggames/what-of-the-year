import { expect, test } from "@playwright/test";

import { addPlayer, cleanup, makeSelection } from "./helpers/convex";

test.beforeAll(async () => {
  await cleanup();
});

test("multiplayer: host flow with advance-round", async ({ page }) => {
  await page.goto("/");

  // Home → Setup
  await page.getByTestId("home-start").click();
  await page.getByTestId("name-input").pressSequentially("Host Player");
  await expect(page.getByTestId("setup-submit")).toBeEnabled();
  await page.getByTestId("setup-submit").click();

  // Lobby — read session ID, verify host state
  await expect(page.getByText("Host Player")).toBeVisible();
  await expect(page.getByText("Host", { exact: true })).toBeVisible();
  await expect(page.getByTestId("player-count")).toBeVisible();

  const sessionId = await page.locator('[data-testid="session-id"]').getAttribute("data-value");
  if (!sessionId) throw new Error("Could not read session ID");

  // Add players via API
  const { uid: player2Uid } = await addPlayer({
    sessionId,
    name: "Player 2",
    avatar: "🎮",
  });
  await expect(page.getByText("Player 2")).toBeVisible();

  const { uid: player3Uid } = await addPlayer({
    sessionId,
    name: "Player 3",
    avatar: "🎲",
  });
  await expect(page.getByText("Player 3")).toBeVisible();

  await page.getByTestId("lobby-start").click();

  // Round 10 — host picks, others submit via API
  await expect(page.getByText("Round 10")).toBeVisible();
  await page.getByTestId("pick-input").fill("a");
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await page.getByTestId("submit-pick").click();

  await makeSelection({ sessionId, uid: player2Uid, roundNumber: 10, pickName: "Elden Ring" });
  await makeSelection({ sessionId, uid: player3Uid, roundNumber: 10, pickName: "Elden Ring" });

  // Round 9
  await expect(page.getByText("Round 9")).toBeVisible();
  await page.getByTestId("pick-input").fill("b");
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await page.getByTestId("submit-pick").click();

  await makeSelection({ sessionId, uid: player2Uid, roundNumber: 9, pickName: "Zelda" });
  await makeSelection({ sessionId, uid: player3Uid, roundNumber: 9, pickName: "Mario" });

  // Round 8 — player 3 unresponsive, host advances via settings
  await expect(page.getByText("Round 8")).toBeVisible();
  await page.getByTestId("pick-input").fill("c");
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await page.getByTestId("submit-pick").click();

  await makeSelection({ sessionId, uid: player2Uid, roundNumber: 8, pickName: "Hades" });

  await page.getByTestId("settings-button").click();
  await expect(page.getByTestId("settings-title")).toBeVisible();
  await expect(page.getByTestId("advance-round")).toBeVisible();
  await page.getByTestId("advance-round").click();

  // Advance rounds 7–2 via settings
  for (let round = 7; round >= 2; round--) {
    await expect(page.getByText(`Round ${round}`)).toBeVisible();
    await page.getByTestId("settings-button").click();
    await page.getByTestId("advance-round").click();
  }

  // Round 1 — End Game
  await expect(page.getByText("Round 1")).toBeVisible();
  await page.getByTestId("settings-button").click();
  await expect(page.getByText("End Game")).toBeVisible();
  await page.getByTestId("advance-round").click();

  // Results
  await expect(page.getByTestId("results-list")).toBeVisible();
  await expect(page.getByText("Elden Ring")).toBeVisible();
  await expect(page.getByText("Zelda")).toBeVisible();
  await expect(page.getByText("Mario")).toBeVisible();
  await expect(page.getByText("Hades")).toBeVisible();
  await expect(page.getByText(/\d+pts/)).toBeVisible();
});
