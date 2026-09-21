import { expect, test } from "@playwright/test";

import { seedGame, seedLobby, signIn } from "../helpers/convex";

const YEAR = 2026;

test("lobby: invite copies session URL to clipboard", async ({ browser }) => {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();

  const { sessionId } = await seedLobby({ name: "Host", year: YEAR, hostUid: await signIn(page) });
  await page.goto(`/games/${YEAR}/${sessionId}`);

  await expect(page.getByTestId("invite")).toBeVisible();

  await page.getByTestId("invite").click();

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain(`/games/${YEAR}/${sessionId}`);

  await context.close();
});

test("lobby: player leaves and host sees update", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  // Each page signs itself in before the seed runs — a page can only be handed
  // an identity it already holds, see `currentUid` in helpers/convex.ts.
  const hostUid = await signIn(hostPage);
  const guestUid = await signIn(guestPage);

  const { sessionId } = await seedGame({
    phase: "lobby",
    year: YEAR,
    players: [
      { name: "Host", uid: hostUid },
      { name: "Guest", uid: guestUid },
    ],
  });

  await hostPage.goto(`/games/${YEAR}/${sessionId}`);
  await guestPage.goto(`/games/${YEAR}/${sessionId}`);

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
  const { sessionId } = await seedGame({
    phase: "round:10",
    year: YEAR,
    players: [{ name: "Host", uid: await signIn(page) }],
  });

  // The lobby URL and the game URL are the same URL — mid-game it renders the
  // round, not the lobby.
  await page.goto(`/games/${YEAR}/${sessionId}`);

  await expect(page.getByTestId("pick-input")).toBeVisible();
  await expect(page.getByTestId("lobby-start")).toHaveCount(0);
});
