import { expect, test } from "@playwright/test";
import { testIds } from "test-ids";

import { seedLobby, signIn } from "../helpers/convex";
import { joinLobby } from "../helpers/session";

test("identity: a reload and a second tab keep the same anonymous player", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const { sessionId } = await seedLobby({ name: "Host", hostUid: await signIn(hostPage) });
  await hostPage.goto(`/games/2026/${sessionId}`);

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await joinLobby(guestPage, sessionId, "Guest");

  await expect(hostPage.getByText("Guest")).toBeVisible();
  await expect(hostPage.getByTestId(testIds.lists.playerCount)).toHaveText("2 of 10");

  // Reload: the stored anonymous identity is recognised, so no join form.
  await guestPage.reload();
  await expect(guestPage.getByTestId(testIds.lobby.leave)).toBeVisible();
  await expect(guestPage.getByTestId(testIds.topic.nameInput)).toHaveCount(0);

  // A second tab of the same context is the same player, not a new one.
  const secondTab = await guestContext.newPage();
  await secondTab.goto(`/games/2026/${sessionId}`);
  await expect(secondTab.getByTestId(testIds.lobby.leave)).toBeVisible();
  await expect(secondTab.getByTestId(testIds.topic.nameInput)).toHaveCount(0);
  await expect(hostPage.getByTestId(testIds.lists.playerCount)).toHaveText("2 of 10");

  await secondTab.close();
  await hostContext.close();
  await guestContext.close();
});

test("identity: a player who leaves can rejoin the same lobby", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const { sessionId } = await seedLobby({ name: "Host", hostUid: await signIn(hostPage) });
  await hostPage.goto(`/games/2026/${sessionId}`);

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await joinLobby(guestPage, sessionId, "Guest");
  await expect(hostPage.getByTestId(testIds.lists.playerCount)).toHaveText("2 of 10");

  await guestPage.getByTestId(testIds.lobby.leave).click();
  await expect(guestPage).toHaveURL("/");
  await expect(hostPage.getByTestId(testIds.lists.playerCount)).toHaveText("1 of 10");

  // Same browser context, same identity, new player row under a new name.
  await joinLobby(guestPage, sessionId, "Rejoiner");

  await expect(hostPage.getByText("Rejoiner")).toBeVisible();
  await expect(hostPage.getByText("Guest", { exact: true })).toHaveCount(0);
  await expect(hostPage.getByTestId(testIds.lists.playerCount)).toHaveText("2 of 10");

  await hostContext.close();
  await guestContext.close();
});
