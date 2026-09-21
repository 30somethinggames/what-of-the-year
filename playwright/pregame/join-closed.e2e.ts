import { expect, test } from "@playwright/test";

import { seedGame, signIn } from "../helpers/convex";

const YEAR = 2026;

test("join: a newcomer opening an active session lands on the error state", async ({ page }) => {
  const { sessionId } = await seedGame({
    phase: "round:10",
    year: YEAR,
    players: [{ name: "Host" }],
  });

  await page.goto(`/games/${YEAR}/${sessionId}`);

  // An active session renders the round in play for whoever opens it, where the
  // member-only round queries throw for a non-member.
  await expect(page.getByTestId("error-state")).toBeVisible();
  await expect(page.getByTestId("name-input")).toHaveCount(0);
  await expect(page.getByTestId("pick-input")).toHaveCount(0);

  // Retry would only throw again for someone who is not a member — the home link
  // is the way out of the boundary.
  await page.getByTestId("error-home").click();
  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("home-start")).toBeVisible();
});

test("join: a newcomer opening an ended session is sent home", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();

  // The host forfeits from a seeded round: the seed's `ended` phase is a game
  // played out, and only a forfeit sends the newcomer home with the toast.
  const { sessionId } = await seedGame({
    phase: "round:10",
    year: YEAR,
    players: [{ name: "Host", uid: await signIn(hostPage) }],
  });

  await hostPage.goto(`/games/${YEAR}/${sessionId}`);
  await expect(hostPage.getByTestId("pick-input")).toBeVisible();

  // "Leave Game" ends the session outright when the host is the one leaving.
  await hostPage.getByTestId("settings-button").click();
  await hostPage.getByTestId("leave-game").click();
  await expect(hostPage).toHaveURL("/");

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(`/games/${YEAR}/${sessionId}`);

  await expect(guestPage.getByTestId("toast")).toContainText("The host forfeited the game.");
  await expect(guestPage).toHaveURL("/");
  await expect(guestPage.getByTestId("home-start")).toBeVisible();
  await expect(guestPage.getByTestId("name-input")).toHaveCount(0);

  await hostContext.close();
  await guestContext.close();
});
