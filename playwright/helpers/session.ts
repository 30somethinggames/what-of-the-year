import { expect, type Page } from "@playwright/test";
import { testIds } from "test-ids";

/** Joins an open lobby through the UI and waits for the joined state. */
export async function joinLobby(page: Page, sessionId: string, name: string) {
  await page.goto(`/games/2026/${sessionId}`);
  await page.getByTestId(testIds.topic.nameInput).fill(name);
  await expect(page.getByTestId(testIds.topic.submit)).toBeEnabled();
  await page.getByTestId(testIds.topic.submit).click();
  await expect(page.getByTestId(testIds.lobby.leave)).toBeVisible();
}

/** Picks the first suggestion for `letter` and submits it. */
export async function pickRound(page: Page, letter: string) {
  await page.getByTestId(testIds.round.pickInput).fill(letter);
  await expect(page.getByTestId(testIds.autocomplete.suggestion).first()).toBeVisible();
  await page.getByTestId(testIds.autocomplete.suggestion).first().click();
  await expect(page.getByTestId(testIds.round.submitPick)).toBeEnabled();
  await page.getByTestId(testIds.round.submitPick).click();
}
