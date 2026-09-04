import { expect, test } from "@playwright/test";

import { createSession } from "../helpers/session";

test("join: an empty or disallowed name keeps the join button disabled", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const sessionId = await createSession(hostPage, "Host");

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(`/games/2026/${sessionId}`);

  // A valid name first: the button is disabled while the options load too, so
  // without this the assertions below could pass for the wrong reason.
  await guestPage.getByTestId("name-input").fill("Guest");
  await expect(guestPage.getByTestId("setup-submit")).toBeEnabled();

  await guestPage.getByTestId("name-input").fill("");
  await expect(guestPage.getByTestId("setup-submit")).toBeDisabled();

  await guestPage.getByTestId("name-input").fill("Bob!");
  await expect(guestPage.getByTestId("setup-submit")).toBeDisabled();
  await expect(
    guestPage.getByText("Only letters, numbers, spaces, hyphens, and periods allowed"),
  ).toBeVisible();

  // Nobody joined.
  await expect(hostPage.getByTestId("player-count")).toHaveText("1 of 10");

  await hostContext.close();
  await guestContext.close();
});

test("join: the name field stops accepting input at the server's max length", async ({ page }) => {
  await page.goto("/games/2026");

  await page.getByTestId("name-input").pressSequentially("abcdefghijklmnopqrstuvwxyz");

  // MAX_NAME_LENGTH is 20 (convex/utils/validate.ts): the field drops the last
  // six characters, so the over-length name never reaches the server.
  await expect(page.getByTestId("name-input")).toHaveValue("abcdefghijklmnopqrst");
  await expect(page.getByTestId("setup-submit")).toBeEnabled();
});

test("join: whitespace-only and duplicate names are accepted today", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const sessionId = await createSession(hostPage, "Twin");

  // The ticket expected a whitespace-only name to be blocked. It is not:
  // `validateName` only screens characters and length, `joinSession` adds
  // nothing, and the button's `name.length < 1` check counts spaces — so "   "
  // joins and takes a nameless row in the lobby. No duplicate-name check exists
  // either. This spec pins the behaviour that ships rather than asserting a
  // block that does not exist; adding the validation is a product change this
  // ticket does not ask for — see the PR notes.
  const blankContext = await browser.newContext();
  const blankPage = await blankContext.newPage();
  await blankPage.goto(`/games/2026/${sessionId}`);
  await blankPage.getByTestId("name-input").fill("   ");
  await expect(blankPage.getByTestId("setup-submit")).toBeEnabled();
  await blankPage.getByTestId("setup-submit").click();
  await expect(blankPage.getByTestId("leave-lobby")).toBeVisible();

  const twinContext = await browser.newContext();
  const twinPage = await twinContext.newPage();
  await twinPage.goto(`/games/2026/${sessionId}`);
  await twinPage.getByTestId("name-input").fill("Twin");
  await expect(twinPage.getByTestId("setup-submit")).toBeEnabled();
  await twinPage.getByTestId("setup-submit").click();
  await expect(twinPage.getByTestId("leave-lobby")).toBeVisible();
  await expect(twinPage.getByTestId("toast")).toHaveCount(0);

  await expect(hostPage.getByText("Twin", { exact: true })).toHaveCount(2);
  await expect(hostPage.getByTestId("player-count")).toHaveText("3 of 10");

  await hostContext.close();
  await blankContext.close();
  await twinContext.close();
});
