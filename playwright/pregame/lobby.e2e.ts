import { expect, test } from "@playwright/test";

test("lobby: invite copies session URL to clipboard", async ({ browser }) => {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();

  await page.goto("/");
  await page.getByTestId("home-start").click();
  await page.getByTestId("name-input").pressSequentially("Host");
  await page.getByTestId("setup-submit").click();

  await expect(page.getByTestId("invite")).toBeVisible();

  const sessionId = await page.getByTestId("session-id").getAttribute("data-value");

  await page.getByTestId("invite").click();

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain(`/games/2026/${sessionId}`);

  await context.close();
});

test("lobby: player leaves and host sees update", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();

  // Host creates session
  await hostPage.goto("/");
  await hostPage.getByTestId("home-start").click();
  await hostPage.getByTestId("name-input").pressSequentially("Host");
  await hostPage.getByTestId("setup-submit").click();

  await expect(hostPage.getByTestId("invite")).toBeVisible();

  const sessionId = await hostPage.getByTestId("session-id").getAttribute("data-value");

  // Guest joins via URL
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  await guestPage.goto(`/games/2026/${sessionId}`);
  await guestPage.getByTestId("name-input").pressSequentially("Guest");
  await guestPage.getByTestId("setup-submit").click();

  // Host sees guest
  await expect(hostPage.getByText("Guest")).toBeVisible();

  // Guest leaves
  await expect(guestPage.getByTestId("leave-lobby")).toBeVisible();
  await guestPage.getByTestId("leave-lobby").click();

  // Guest redirected home
  await expect(guestPage).toHaveURL("/");

  // Host sees guest gone
  await expect(hostPage.getByText("Guest")).not.toBeVisible();

  await hostContext.close();
  await guestContext.close();
});

test("lobby: host reopening the lobby URL mid-game lands on the active round", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("home-start").click();
  await page.getByTestId("name-input").pressSequentially("Host");
  await page.getByTestId("setup-submit").click();

  await expect(page.getByTestId("lobby-start")).toBeVisible();
  const sessionId = await page.getByTestId("session-id").getAttribute("data-value");

  await page.getByTestId("lobby-start").click();
  await expect(page.getByTestId("pick-input")).toBeVisible();

  // Host reloads the lobby URL while the game is active
  await page.goto(`/games/2026/${sessionId}`);

  await expect(page.getByTestId("pick-input")).toBeVisible();
  await expect(page.getByTestId("lobby-start")).toHaveCount(0);
});
