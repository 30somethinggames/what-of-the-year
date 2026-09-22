import { expect, test } from "@playwright/test";
import { testIds } from "test-ids";

// `createSession` allows 5 calls a minute per user (convex/ratelimits.ts).
// Failed mutations roll their token consumption back with the rest of the
// transaction, so a bucket only empties on calls that succeed: this spec creates
// its allowance of sessions and then asks for one more.
const ALLOWANCE = 5;

test("rate limit: exceeding the create bucket surfaces the limit in a toast", async ({ page }) => {
  for (let i = 0; i < ALLOWANCE; i++) {
    await page.goto("/games/2026");
    await page.getByTestId(testIds.topic.nameInput).fill(`Host ${i}`);
    await expect(page.getByTestId(testIds.topic.submit)).toBeEnabled();
    await page.getByTestId(testIds.topic.submit).click();
    await expect(page.getByTestId(testIds.lobby.start)).toBeVisible();
  }

  await page.goto("/games/2026");
  await page.getByTestId(testIds.topic.nameInput).fill("One Too Many");
  await expect(page.getByTestId(testIds.topic.submit)).toBeEnabled();
  await page.getByTestId(testIds.topic.submit).click();

  // The rate limiter's message, not a silent failure or the generic fallback.
  await expect(page.getByTestId(testIds.toast.root)).toContainText("Slow down and try again");

  // Rejected: still on the topic screen, no session created.
  await expect(page.getByTestId(testIds.topic.nameInput)).toBeVisible();
  await expect(page.getByTestId(testIds.lobby.start)).toHaveCount(0);
});
