import { expect, test, type Page } from "@playwright/test";

import { cleanup } from "./helpers/convex";

test.beforeAll(async () => {
  await cleanup();
});

async function pickRound(page: Page, letter: string) {
  await page.getByTestId("pick-input").fill(letter);
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();
  await page.getByTestId("submit-pick").click();
}

test("non-host: lobby UI and round experience", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();

  // Host creates session
  await hostPage.goto("/");
  await hostPage.getByTestId("home-start").click();
  await hostPage.getByTestId("name-input").pressSequentially("Host");
  await hostPage.getByTestId("setup-submit").click();
  await expect(hostPage.getByTestId("invite")).toBeVisible();

  const sessionId = await hostPage.getByTestId("session-id").getAttribute("data-value");

  // Non-host joins via URL
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  await guestPage.goto(`/games/2026/${sessionId}`);
  await guestPage.getByTestId("name-input").pressSequentially("Guest");
  await guestPage.getByTestId("setup-submit").click();

  // Non-host lobby: sees Leave, no Invite or Start
  await expect(guestPage.getByTestId("leave-lobby")).toBeVisible();
  await expect(guestPage.getByTestId("invite")).not.toBeVisible();
  await expect(guestPage.getByTestId("lobby-start")).not.toBeVisible();

  // Host starts game
  await hostPage.getByTestId("lobby-start").click();
  await expect(hostPage.getByText("Round 10")).toBeVisible();

  // Non-host auto-redirects to round 10
  await expect(guestPage.getByText("Round 10")).toBeVisible();

  // Non-host opens sidebar — no advance button
  await guestPage.getByTestId("settings-button").click();
  await expect(guestPage.getByTestId("sidebar-title")).toBeVisible();
  await expect(guestPage.getByTestId("leave-game")).toBeVisible();
  await expect(guestPage.getByTestId("advance-round")).not.toBeVisible();

  // Close sidebar
  await guestPage.getByTestId("close-sidebar").click();
  await expect(guestPage.getByTestId("sidebar-title")).not.toBeVisible();

  // Non-host makes a pick
  await pickRound(guestPage, "a");

  // Host makes a pick → round auto-advances (both players picked)
  await pickRound(hostPage, "b");

  // Both see round 9
  await expect(guestPage.getByText("Round 9")).toBeVisible();
  await expect(hostPage.getByText("Round 9")).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});
