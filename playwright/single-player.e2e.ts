import { expect, test, type Page } from "@playwright/test";

async function pickRound(page: Page, letter: string) {
  await page.getByTestId("pick-input").fill(letter);
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();
  await page.getByTestId("submit-pick").click();
}

test("single-player: full game", async ({ page }) => {
  page.on("console", (msg) => {
    if (msg.text().includes("[round]")) {
      // oxlint-disable-next-line no-console
      console.log(`[browser] ${msg.text()}`);
    }
  });
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

  await page.getByTestId("edit-pick").click();
  await expect(page.getByTestId("cancel-edit")).toBeVisible();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();
  await page.getByTestId("submit-pick").click();
  await expect(page.getByTestId("submit-pick")).toContainText("Enter");

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
