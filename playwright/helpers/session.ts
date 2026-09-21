import { expect, type Page } from "@playwright/test";

/** Joins an open lobby through the UI and waits for the joined state. */
export async function joinLobby(page: Page, sessionId: string, name: string) {
  await page.goto(`/games/2026/${sessionId}`);
  await page.getByTestId("name-input").fill(name);
  await expect(page.getByTestId("setup-submit")).toBeEnabled();
  await page.getByTestId("setup-submit").click();
  await expect(page.getByTestId("leave-lobby")).toBeVisible();
}

/** Picks the first suggestion for `letter` and submits it. */
export async function pickRound(page: Page, letter: string) {
  await page.getByTestId("pick-input").fill(letter);
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();
  await page.getByTestId("submit-pick").click();
}
