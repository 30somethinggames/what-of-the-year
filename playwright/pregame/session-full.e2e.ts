import { expect, test } from "@playwright/test";

import { MAX_PLAYERS } from "convex/constants";

import { addPlayer } from "../helpers/convex";
import { createSession } from "../helpers/session";

test("join: a full session rejects the newcomer with the server's error", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();

  const sessionId = await createSession(hostPage, "Host");

  // The host holds the first seat; seed the rest so the lobby is at the cap.
  for (let i = 2; i <= MAX_PLAYERS; i++) {
    await addPlayer({ sessionId, name: `Player ${i}`, avatar: "🎮" });
  }
  await expect(hostPage.getByText(`${MAX_PLAYERS} of ${MAX_PLAYERS}`)).toBeVisible();

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  await guestPage.goto(`/games/2026/${sessionId}`);
  await guestPage.getByTestId("name-input").fill("Latecomer");
  await expect(guestPage.getByTestId("setup-submit")).toBeEnabled();
  await guestPage.getByTestId("setup-submit").click();

  await expect(guestPage.getByTestId("toast")).toContainText("Session is full");

  // Rejected: still on the join form, and never listed in the host's lobby.
  await expect(guestPage.getByTestId("name-input")).toBeVisible();
  await expect(guestPage.getByTestId("leave-lobby")).toHaveCount(0);
  await expect(hostPage.getByText("Latecomer")).toHaveCount(0);
  await expect(hostPage.getByText(`${MAX_PLAYERS} of ${MAX_PLAYERS}`)).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});
