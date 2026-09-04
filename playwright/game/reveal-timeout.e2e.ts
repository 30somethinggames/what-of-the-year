import { expect, test } from "@playwright/test";

import { createSession } from "../helpers/session";

// Every other reveal spec clicks `reveal-skip`, so the scheduled
// `internal.rounds.completeReveal` job never runs end to end. Here the host
// leaves it alone: a one-player session reveals for playerCount * 4s + 5s = 9s
// (convex/rounds.ts), well inside the 30s test timeout.
test("reveal: the scheduled job advances the round when the host never skips", async ({ page }) => {
  await createSession(page, "Host");

  await page.getByTestId("lobby-start").click();
  await expect(page.getByText("Round 10")).toBeVisible();

  // Submitting the only pick closes the round and schedules the reveal.
  await page.getByTestId("pick-input").fill("a");
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();
  await page.getByTestId("submit-pick").click();

  await expect(page.getByTestId("reveal-container")).toBeVisible();
  await expect(page.getByTestId("reveal-skip")).toBeVisible();

  // The countdown bar fills over the server's reveal window, so its width grows
  // while the reveal is in play.
  const countdown = page.getByTestId("reveal-countdown");
  await expect(countdown).toBeVisible();
  const startWidth = (await countdown.boundingBox())?.width ?? 0;
  await expect
    .poll(async () => (await countdown.boundingBox())?.width ?? 0, { timeout: 5_000 })
    .toBeGreaterThan(startWidth);

  // No skip click anywhere in this spec — the scheduled job does the advancing.
  await expect(page.getByText("Round 9")).toBeVisible();
  await expect(page.getByTestId("reveal-container")).toHaveCount(0);
  await expect(page.getByTestId("pick-input")).toBeVisible();
});
