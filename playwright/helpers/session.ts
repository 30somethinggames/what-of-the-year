import { expect, type Page } from "@playwright/test";

/**
 * Creates a session through the UI — there is no server-side seed for it — and
 * returns the session ID the lobby shows. The page is left in the lobby.
 */
export async function createSession(page: Page, name: string) {
  await page.goto("/");
  await page.getByTestId("home-start").click();
  await page.getByTestId("name-input").pressSequentially(name);
  await expect(page.getByTestId("setup-submit")).toBeEnabled();
  await page.getByTestId("setup-submit").click();

  await expect(page.getByTestId("lobby-start")).toBeVisible();
  const sessionId = await page.getByTestId("session-id").getAttribute("data-value");
  if (!sessionId) throw new Error("Could not read session ID");
  return sessionId;
}

/** Joins an open lobby through the UI and waits for the joined state. */
export async function joinLobby(page: Page, sessionId: string, name: string) {
  await page.goto(`/games/2026/${sessionId}`);
  await page.getByTestId("name-input").fill(name);
  await expect(page.getByTestId("setup-submit")).toBeEnabled();
  await page.getByTestId("setup-submit").click();
  await expect(page.getByTestId("leave-lobby")).toBeVisible();
}
