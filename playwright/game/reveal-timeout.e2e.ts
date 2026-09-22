import { expect, test } from "@playwright/test";
import { testIds } from "test-ids";

import { seedGame, signIn } from "../helpers/convex";

const YEAR = 2026;

// Every other reveal spec clicks `reveal-skip`, so the scheduled
// `internal.rounds.completeReveal` job never runs end to end. Here the host
// leaves it alone: a one-player session reveals for playerCount * 4s + 5s = 9s
// (convex/rounds.ts), well inside the 30s test timeout.
test("reveal: the scheduled job advances the round when the host never skips", async ({ page }) => {
  // Seeded open rather than seeded revealing: the pick has to go in through the
  // UI for the app to schedule the job this spec waits on.
  const { sessionId } = await seedGame({
    phase: "round:10",
    year: YEAR,
    players: [{ name: "Host", uid: await signIn(page) }],
  });

  await page.goto(`/games/${YEAR}/${sessionId}`);
  await expect(page.getByText("Round 10")).toBeVisible();

  // Submitting the only pick closes the round and schedules the reveal.
  await page.getByTestId(testIds.round.pickInput).fill("a");
  await expect(page.getByTestId(testIds.autocomplete.suggestion).first()).toBeVisible();
  await page.getByTestId(testIds.autocomplete.suggestion).first().click();
  await expect(page.getByTestId(testIds.round.submitPick)).toBeEnabled();
  await page.getByTestId(testIds.round.submitPick).click();

  await expect(page.getByTestId(testIds.reveal.container)).toBeVisible();
  await expect(page.getByTestId(testIds.reveal.skip)).toBeVisible();

  // The countdown bar fills over the server's reveal window, so its width grows
  // while the reveal is in play.
  const countdown = page.getByTestId(testIds.reveal.countdown);
  await expect(countdown).toBeVisible();
  const startWidth = (await countdown.boundingBox())?.width ?? 0;
  await expect
    .poll(async () => (await countdown.boundingBox())?.width ?? 0, { timeout: 5_000 })
    .toBeGreaterThan(startWidth);

  // No skip click anywhere in this spec — the scheduled job does the advancing.
  await expect(page.getByText("Round 9")).toBeVisible();
  await expect(page.getByTestId(testIds.reveal.container)).toHaveCount(0);
  await expect(page.getByTestId(testIds.round.pickInput)).toBeVisible();
});
