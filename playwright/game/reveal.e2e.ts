import { expect, test, type Page } from "@playwright/test";

async function skipReveal(page: Page) {
  await expect(page.getByTestId("reveal-skip")).toBeVisible();
  await page.getByTestId("reveal-skip").click();
}

async function pickAndSkipReveal(page: Page, letter: string) {
  await page.getByTestId("pick-input").fill(letter);
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();
  await page.getByTestId("submit-pick").click();
  await skipReveal(page);
}

test("reveal: shows player name and pick, host can skip", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("home-start").click();
  await page.getByTestId("name-input").pressSequentially("E2E Tester");
  await page.getByTestId("setup-submit").click();
  await page.getByTestId("lobby-start").click();

  await expect(page.getByText("Round 10")).toBeVisible();

  // Submit pick — reveal starts immediately (single player, all complete)
  await page.getByTestId("pick-input").fill("a");
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await page.getByTestId("submit-pick").click();

  // Verify reveal content
  await expect(page.getByTestId("reveal-container")).toBeVisible();
  await expect(page.getByTestId("reveal-player-name")).toContainText("E2E Tester");
  await expect(page.getByTestId("reveal-skip")).toBeVisible();

  // Skip reveal → next round
  await page.getByTestId("reveal-skip").click();
  await expect(page.getByText("Round 9")).toBeVisible();

  // Skip through remaining rounds
  const letters = ["c", "d", "e", "f", "g", "h", "m", "p", "s"];
  for (let round = 9; round >= 1; round--) {
    await expect(page.getByText(`Round ${round}`)).toBeVisible();
    await pickAndSkipReveal(page, letters[9 - round]);
  }

  await expect(page.getByTestId("results-list")).toBeVisible();
});

test("reveal: non-host sees reveal but not skip button", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();

  await hostPage.goto("/");
  await hostPage.getByTestId("home-start").click();
  await hostPage.getByTestId("name-input").pressSequentially("Host");
  await expect(hostPage.getByTestId("setup-submit")).toBeEnabled();
  await hostPage.getByTestId("setup-submit").click();

  const sessionId = await hostPage.getByTestId("session-id").getAttribute("data-value");
  if (!sessionId) throw new Error("Could not read session ID");

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  await guestPage.goto(`/games/2026/${sessionId}`);
  await guestPage.getByTestId("name-input").pressSequentially("Guest");
  await expect(guestPage.getByTestId("setup-submit")).toBeEnabled();
  await guestPage.getByTestId("setup-submit").click();

  await hostPage.getByTestId("lobby-start").click();
  await expect(hostPage.getByText("Round 10")).toBeVisible();
  await expect(guestPage.getByText("Round 10")).toBeVisible();

  // Guest picks first, then host — last submission triggers reveal
  await guestPage.getByTestId("pick-input").fill("a");
  await expect(guestPage.getByTestId("suggestion-item").first()).toBeVisible();
  await guestPage.getByTestId("suggestion-item").first().click();
  await guestPage.getByTestId("submit-pick").click();

  await hostPage.getByTestId("pick-input").fill("b");
  await expect(hostPage.getByTestId("suggestion-item").first()).toBeVisible();
  await hostPage.getByTestId("suggestion-item").first().click();
  await hostPage.getByTestId("submit-pick").click();

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
