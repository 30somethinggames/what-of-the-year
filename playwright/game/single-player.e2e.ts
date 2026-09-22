import { expect, test, type Page } from "@playwright/test";
import { testIds } from "test-ids";

async function pickRound(page: Page, letter: string) {
  await page.getByTestId(testIds.round.pickInput).fill(letter);
  await expect(page.getByTestId(testIds.autocomplete.suggestion).first()).toBeVisible();
  await page.getByTestId(testIds.autocomplete.suggestion).first().click();
  await expect(page.getByTestId(testIds.round.submitPick)).toBeEnabled();
  await page.getByTestId(testIds.round.submitPick).click();
  await expect(page.getByTestId(testIds.reveal.skip)).toBeVisible();
  await page.getByTestId(testIds.reveal.skip).click();
}

test("single-player: full game", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/");

  // Home → Setup
  await page.getByTestId(testIds.home.start).click();
  await page.getByTestId(testIds.topic.nameInput).pressSequentially("E2E Tester");
  await expect(page.getByTestId(testIds.topic.submit)).toBeEnabled();
  await page.getByTestId(testIds.topic.submit).click();

  // Lobby
  await expect(page.getByText("E2E Tester")).toBeVisible();
  await expect(page.getByText("Host", { exact: true })).toBeVisible();
  await expect(page.getByTestId(testIds.lobby.start)).toBeVisible();
  await page.getByTestId(testIds.lobby.start).click();

  // Round 10 — pick + edit flow
  await expect(page.getByText("Round 10")).toBeVisible();
  await page.getByTestId(testIds.round.pickInput).fill("a");
  await expect(page.getByTestId(testIds.autocomplete.suggestion).first()).toBeVisible();
  await page.getByTestId(testIds.autocomplete.suggestion).first().click();
  await expect(page.getByTestId(testIds.round.submitPick)).toBeEnabled();
  await page.getByTestId(testIds.round.submitPick).click();

  // Reveal phase — skip to continue
  await expect(page.getByTestId(testIds.reveal.skip)).toBeVisible();
  await page.getByTestId(testIds.reveal.skip).click();

  // Round 10 is closed — its pick is locked, so no Edit affordance
  await expect(page.getByText("Round 9")).toBeVisible();
  await expect(page.getByTestId(testIds.round.list)).toBeVisible();
  await expect(page.getByTestId(testIds.lists.editPick)).toHaveCount(0);

  // Rounds 9–1
  const letters = ["c", "d", "e", "f", "g", "h", "m", "p", "s"];
  for (let round = 9; round >= 1; round--) {
    await expect(page.getByText(`Round ${round}`)).toBeVisible();
    await pickRound(page, letters[9 - round]);
  }

  // Results
  await expect(page.getByTestId(testIds.results.list)).toBeVisible();
  await expect(page.getByText("E2E Tester").first()).toBeVisible();
  await expect(page.getByText("10pts").first()).toBeVisible();
});
