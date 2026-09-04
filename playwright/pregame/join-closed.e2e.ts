import { expect, test } from "@playwright/test";

import { createSession } from "../helpers/session";

test("join: a newcomer opening an active session lands on the error state", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();

  const sessionId = await createSession(hostPage, "Host");
  await hostPage.getByTestId("lobby-start").click();
  await expect(hostPage.getByTestId("pick-input")).toBeVisible();

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(`/games/2026/${sessionId}`);

  // The lobby redirects anyone opening an active session to the round in play,
  // where the member-only round queries throw for a non-member.
  await expect(guestPage).toHaveURL(`/games/2026/${sessionId}/10`);
  await expect(guestPage.getByTestId("error-state")).toBeVisible();
  await expect(guestPage.getByTestId("name-input")).toHaveCount(0);
  await expect(guestPage.getByTestId("pick-input")).toHaveCount(0);

  // Retry would only throw again for someone who is not a member — the home link
  // is the way out of the boundary.
  await guestPage.getByTestId("error-home").click();
  await expect(guestPage).toHaveURL("/");
  await expect(guestPage.getByTestId("home-start")).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});

test("join: a newcomer opening an ended session is sent home", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();

  const sessionId = await createSession(hostPage, "Host");
  await hostPage.getByTestId("lobby-start").click();
  await expect(hostPage.getByTestId("pick-input")).toBeVisible();

  // "Leave Game" ends the session outright when the host is the one leaving.
  await hostPage.getByTestId("settings-button").click();
  await hostPage.getByTestId("leave-game").click();
  await expect(hostPage).toHaveURL("/");

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(`/games/2026/${sessionId}`);

  await expect(guestPage.getByTestId("toast")).toContainText("The host ended the game.");
  await expect(guestPage).toHaveURL("/");
  await expect(guestPage.getByTestId("home-start")).toBeVisible();
  await expect(guestPage.getByTestId("name-input")).toHaveCount(0);

  await hostContext.close();
  await guestContext.close();
});
