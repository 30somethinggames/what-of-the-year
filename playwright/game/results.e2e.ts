import { expect, test } from "@playwright/test";
import { testIds } from "test-ids";

import { seedGame, signIn } from "../helpers/convex";

const YEAR = 2026;
const PLAYER_2 = "seeded-player-2";
const PLAYER_3 = "seeded-player-3";

test("results: scoring breakdown with shared picks", async ({ page }) => {
  const hostUid = await signIn(page);

  // A round is worth MAX_ROUNDS + 1 - number, so round 10 pays 1pt and round 9
  // pays 2. "Elden Ring" takes both round 10 votes and Player 2's round 9 one.
  const { sessionId } = await seedGame({
    phase: "ended",
    year: YEAR,
    players: [
      { name: "Host", uid: hostUid },
      { name: "Player 2", uid: PLAYER_2 },
      { name: "Player 3", uid: PLAYER_3 },
    ],
    selections: [
      { uid: hostUid, roundNumber: 10, pickName: "Alpha Quest" },
      { uid: PLAYER_2, roundNumber: 10, pickName: "Elden Ring" },
      { uid: PLAYER_3, roundNumber: 10, pickName: "Elden Ring" },
      { uid: hostUid, roundNumber: 9, pickName: "Bravo Quest" },
      { uid: PLAYER_2, roundNumber: 9, pickName: "Elden Ring" },
      { uid: PLAYER_3, roundNumber: 9, pickName: "Zelda" },
    ],
  });

  await page.goto(`/games/${YEAR}/${sessionId}`);

  // Results screen
  await expect(page.getByTestId(testIds.results.list)).toBeVisible();

  // "Elden Ring" picked by P2 in round 10 (1pt) + P3 in round 10 (1pt) + P2 in round 9 (2pts) = 4pts
  await expect(page.getByText("Elden Ring")).toBeVisible();
  await expect(page.getByText("4pts")).toBeVisible();

  // Results are sorted by total points descending
  const results = page.getByTestId(testIds.results.list);
  const items = results.locator("> *");

  // #1: Elden Ring — 4pts, voted by Player 2 + Player 3
  await expect(items.nth(0)).toContainText("Elden Ring");
  await expect(items.nth(0)).toContainText("4pts");
  await expect(items.nth(0)).toContainText("Player 2");
  await expect(items.nth(0)).toContainText("Player 3");

  // Zelda — 2pts, voted by Player 3
  const zeldaRow = items.filter({ hasText: "Zelda" });
  await expect(zeldaRow).toContainText("2pts");
  await expect(zeldaRow).toContainText("Player 3");
});
