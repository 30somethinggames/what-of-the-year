import { expect, test, type Page } from "@playwright/test";

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
  await expect(hostPage.getByTestId("setup-submit")).toBeEnabled();
  await hostPage.getByTestId("setup-submit").click();
  await expect(hostPage.getByTestId("invite")).toBeVisible();

  const sessionId = await hostPage.getByTestId("session-id").getAttribute("data-value");

  // Non-host joins via URL
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  await guestPage.goto(`/games/2026/${sessionId}`);
  await guestPage.getByTestId("name-input").pressSequentially("Guest");
  await expect(guestPage.getByTestId("setup-submit")).toBeEnabled();
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

  // Host makes a pick → all submitted → reveal starts
  await pickRound(hostPage, "b");

  // Reveal phase: host sees skip button, non-host does not
  await expect(hostPage.getByTestId("reveal-container")).toBeVisible();
  await expect(hostPage.getByTestId("reveal-skip")).toBeVisible();
  await expect(guestPage.getByTestId("reveal-container")).toBeVisible();
  await expect(guestPage.getByTestId("reveal-skip")).not.toBeVisible();

  // Host skips reveal → both advance to round 9
  await hostPage.getByTestId("reveal-skip").click();
  await expect(guestPage.getByText("Round 9")).toBeVisible();
  await expect(hostPage.getByText("Round 9")).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});

test("non-host: host leaving game shows toast and redirects to home", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();

  await hostPage.goto("/");
  await hostPage.getByTestId("home-start").click();
  await hostPage.getByTestId("name-input").pressSequentially("Host");
  await expect(hostPage.getByTestId("setup-submit")).toBeEnabled();
  await hostPage.getByTestId("setup-submit").click();
  await expect(hostPage.getByTestId("invite")).toBeVisible();

  const sessionId = await hostPage.getByTestId("session-id").getAttribute("data-value");

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  await guestPage.goto(`/games/2026/${sessionId}`);
  await guestPage.getByTestId("name-input").pressSequentially("Guest");
  await expect(guestPage.getByTestId("setup-submit")).toBeEnabled();
  await guestPage.getByTestId("setup-submit").click();

  await hostPage.getByTestId("lobby-start").click();
  await expect(guestPage.getByText("Round 10")).toBeVisible();

  // Host leaves game mid-round (triggers endSession)
  await hostPage.getByTestId("settings-button").click();
  await expect(hostPage.getByTestId("leave-game")).toBeVisible();
  await hostPage.getByTestId("leave-game").click();

  // Guest sees error toast and is redirected to home
  await expect(guestPage.getByTestId("toast")).toBeVisible();
  await expect(guestPage.getByTestId("toast")).toHaveText("The host ended the game.");
  await expect(guestPage.getByTestId("home-start")).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});
