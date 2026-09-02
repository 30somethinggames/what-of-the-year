import { expect, test, type Page } from "@playwright/test";

async function pickRound(page: Page, letter: string) {
  await page.getByTestId("pick-input").fill(letter);
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();
  await page.getByTestId("submit-pick").click();
  await expect(page.getByTestId("reveal-skip")).toBeVisible();
  await page.getByTestId("reveal-skip").click();
}

test("single-player: full game", async ({ page }) => {
  await page.goto("/");

  // Home → Setup
  await page.getByTestId("home-start").click();
  await page.getByTestId("name-input").pressSequentially("E2E Tester");
  await expect(page.getByTestId("setup-submit")).toBeEnabled();
  await page.getByTestId("setup-submit").click();

  // Lobby
  await expect(page.getByText("E2E Tester")).toBeVisible();
  await expect(page.getByText("Host", { exact: true })).toBeVisible();
  await expect(page.getByTestId("lobby-start")).toBeVisible();
  await page.getByTestId("lobby-start").click();

  // Round 10 — pick + edit flow
  await expect(page.getByText("Round 10")).toBeVisible();
  await page.getByTestId("pick-input").fill("a");
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();
  await page.getByTestId("submit-pick").click();

  // Reveal phase — skip to continue
  await expect(page.getByTestId("reveal-skip")).toBeVisible();
  await page.getByTestId("reveal-skip").click();

  // Round 10 is closed — its pick is locked, so no Edit affordance
  await expect(page.getByText("Round 9")).toBeVisible();
  await expect(page.getByTestId("round-list")).toBeVisible();
  await expect(page.getByTestId("edit-pick")).toHaveCount(0);

  // Rounds 9–1
  const letters = ["c", "d", "e", "f", "g", "h", "m", "p", "s"];
  for (let round = 9; round >= 1; round--) {
    await expect(page.getByText(`Round ${round}`)).toBeVisible();
    await pickRound(page, letters[9 - round]);
  }

  // Results
  await expect(page.getByTestId("results-list")).toBeVisible();
  await expect(page.getByText("E2E Tester").first()).toBeVisible();
  await expect(page.getByText("10pts").first()).toBeVisible();
});
