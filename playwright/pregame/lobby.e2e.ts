import { expect, test } from "@playwright/test";
import { testIds } from "test-ids";

import { seedGame, seedLobby, signIn } from "../helpers/convex";

const YEAR = 2026;

test("lobby: invite copies session URL to clipboard", async ({ browser }) => {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();

  const { sessionId } = await seedLobby({ name: "Host", year: YEAR, hostUid: await signIn(page) });
  await page.goto(`/games/${YEAR}/${sessionId}`);

  await expect(page.getByTestId(testIds.lobby.invite)).toBeVisible();

  await page.getByTestId(testIds.lobby.invite).click();

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain(`/games/${YEAR}/${sessionId}`);

  await context.close();
});

test("lobby: player leaves and host sees update", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

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
  await expect(guestPage.getByTestId(testIds.lobby.leave)).toBeVisible();
  await guestPage.getByTestId(testIds.lobby.leave).click();

  // Guest redirected home
  await expect(guestPage).toHaveURL("/");

  // Host sees guest gone
  await expect(hostPage.getByText("Guest")).not.toBeVisible();

  await hostContext.close();
  await guestContext.close();
});

test("lobby: host reopening the lobby URL mid-game lands on the active round", async ({ page }) => {
  const { sessionId } = await seedGame({
    phase: "lobby",
    year: YEAR,
    players: [{ name: "Host", uid: await signIn(page) }],
  });

  await page.goto(`/games/${YEAR}/${sessionId}`);
  await expect(page.getByTestId(testIds.lobby.start)).toBeVisible();

  await page.getByTestId(testIds.lobby.start).click();
  await expect(page.getByTestId(testIds.round.pickInput)).toBeVisible();

  // Host reopens the lobby URL while the game is active
  await page.goto(`/games/${YEAR}/${sessionId}`);

  await expect(page.getByTestId(testIds.round.pickInput)).toBeVisible();
  await expect(page.getByTestId(testIds.lobby.start)).toHaveCount(0);
});
