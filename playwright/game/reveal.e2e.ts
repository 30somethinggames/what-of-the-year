import { expect, test } from "@playwright/test";

import { seedGame, signIn } from "../helpers/convex";
import { pickRound } from "../helpers/session";

const YEAR = 2026;

test("reveal: shows player name and pick, host can skip", async ({ page }) => {
  const uid = await signIn(page);
  const { sessionId } = await seedGame({
    phase: "round:10",
    year: YEAR,
    players: [{ name: "E2E Tester", uid }],
  });

  await page.goto(`/games/${YEAR}/${sessionId}`);
  await expect(page.getByText("Round 10")).toBeVisible();

  // Submit pick — reveal starts immediately (single player, all complete)
  await pickRound(page, "a");

  // Verify reveal content
  await expect(page.getByTestId("reveal-container")).toBeVisible();
  await expect(page.getByTestId("reveal-player-name")).toContainText("E2E Tester");
  await expect(page.getByTestId("reveal-skip")).toBeVisible();

  // Skip reveal → next round
  await page.getByTestId("reveal-skip").click();
  await expect(page.getByText("Round 9")).toBeVisible();

  // The last round's reveal ends the game instead of opening another round —
  // a second session seeded there, rather than nine rounds played to reach it.
  const lastRound = await seedGame({
    phase: "revealing:1",
    year: YEAR,
    players: [{ name: "E2E Tester", uid }],
    selections: [{ uid, roundNumber: 1, pickName: "Zulu Quest" }],
  });

  await page.goto(`/games/${YEAR}/${lastRound.sessionId}`);
  await expect(page.getByTestId("reveal-skip")).toBeVisible();
  await page.getByTestId("reveal-skip").click();

  await expect(page.getByTestId("results-list")).toBeVisible();
});

test("reveal: non-host sees reveal but not skip button", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  const hostUid = await signIn(hostPage);
  const guestUid = await signIn(guestPage);

  const { sessionId } = await seedGame({
    phase: "round:10",
    year: YEAR,
    players: [
      { name: "Host", uid: hostUid },
      { name: "Guest", uid: guestUid },
    ],
  });

  await hostPage.goto(`/games/${YEAR}/${sessionId}`);
  await guestPage.goto(`/games/${YEAR}/${sessionId}`);

  await expect(hostPage.getByText("Round 10")).toBeVisible();
  await expect(guestPage.getByText("Round 10")).toBeVisible();

  // Guest picks first, then host — last submission triggers reveal
  await pickRound(guestPage, "a");
  await pickRound(hostPage, "b");

  // Both see reveal; only host sees skip button
  await expect(hostPage.getByTestId("reveal-container")).toBeVisible();
  await expect(hostPage.getByTestId("reveal-skip")).toBeVisible();
  await expect(guestPage.getByTestId("reveal-container")).toBeVisible();
  await expect(guestPage.getByTestId("reveal-skip")).not.toBeVisible();

  // Host skips — both advance to round 9
  await hostPage.getByTestId("reveal-skip").click();
  await expect(hostPage.getByText("Round 9")).toBeVisible();
  await expect(guestPage.getByText("Round 9")).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});
