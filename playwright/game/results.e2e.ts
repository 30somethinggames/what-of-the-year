import { expect, test } from "@playwright/test";

import { addPlayer, makeSelection } from "../helpers/convex";

test("results: scoring breakdown with shared picks", async ({ page }) => {
  await page.goto("/");

  // Home → Setup → Lobby
  await page.getByTestId("home-start").click();
  await page.getByTestId("name-input").pressSequentially("Host");
  await page.getByTestId("setup-submit").click();

  const sessionId = await page.locator('[data-testid="session-id"]').getAttribute("data-value");
  if (!sessionId) throw new Error("Could not read session ID");

  const { uid: p2Uid } = await addPlayer({ sessionId, name: "Player 2" });
  const { uid: p3Uid } = await addPlayer({ sessionId, name: "Player 3" });

  await page.getByTestId("lobby-start").click();

  // Round 10 (1pt each): Host picks via UI, P2 + P3 both pick "Elden Ring"
  await expect(page.getByText("Round 10")).toBeVisible();
  await page.getByTestId("pick-input").fill("a");
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await page.getByTestId("submit-pick").click();
  await expect(page.getByTestId("submit-pick")).toBeDisabled();

  await makeSelection({ sessionId, uid: p2Uid, roundNumber: 10, pickName: "Elden Ring" });
  await makeSelection({ sessionId, uid: p3Uid, roundNumber: 10, pickName: "Elden Ring" });

  // Round 9 (2pts each): Host picks via UI, P2 picks "Elden Ring", P3 picks "Zelda"
  await expect(page.getByText("Round 9")).toBeVisible();
  await page.getByTestId("pick-input").fill("b");
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await page.getByTestId("submit-pick").click();
  await expect(page.getByTestId("submit-pick")).toBeDisabled();

  await makeSelection({ sessionId, uid: p2Uid, roundNumber: 9, pickName: "Elden Ring" });
  await makeSelection({ sessionId, uid: p3Uid, roundNumber: 9, pickName: "Zelda" });

  // Advance rounds 8→1 via sidebar (no picks made — advances directly, no reveal)
  await expect(page.getByText("Round 8")).toBeVisible();
  await page.getByTestId("settings-button").click();
  await expect(page.getByTestId("sidebar-title")).toBeVisible();
  await expect(page.getByTestId("advance-round")).toBeVisible();
  await page.getByTestId("advance-round").click();

  for (let round = 7; round >= 2; round--) {
    await expect(page.getByText(`Round ${round}`)).toBeVisible();
    await expect(page.getByTestId("advance-round")).toBeVisible();
    await page.getByTestId("advance-round").click();
  }

  // Round 1 — End Game
  await expect(page.getByText("Round 1")).toBeVisible();
  await expect(page.getByText("End Game")).toBeVisible();
  await page.getByTestId("advance-round").click();

  // Results screen
  await expect(page.getByTestId("results-list")).toBeVisible();

  // "Elden Ring" picked by P2 in round 10 (1pt) + P3 in round 10 (1pt) + P2 in round 9 (2pts) = 4pts
  await expect(page.getByText("Elden Ring")).toBeVisible();
  await expect(page.getByText("4pts")).toBeVisible();

  // Results are sorted by total points descending
  const results = page.getByTestId("results-list");
  const items = results.locator("> *");

  // #1: Elden Ring — 4pts, voted by Player 2 + Player 3
  await expect(items.nth(0)).toContainText("Elden Ring");
  await expect(items.nth(0)).toContainText("4pts");
  await expect(items.nth(0)).toContainText("Player 2");
  await expect(items.nth(0)).toContainText("Player 3");

  // #3: Zelda — 2pts, voted by Player 3
  const zeldaRow = items.filter({ hasText: "Zelda" });
  await expect(zeldaRow).toContainText("2pts");
  await expect(zeldaRow).toContainText("Player 3");
});
