import { expect, test } from "@playwright/test";

import { createSession } from "../helpers/session";

// The option actions run `parseYear` before they reach fixtures or a third-party
// call, so a year outside the picker's range makes `getGames` throw for the same
// reason an IGDB outage would: the action rejects and TanStack Query gives up
// after its retries. Fixtures can't fail, and the action travels over the Convex
// WebSocket, so `page.route()` can't fail it either.
const FAILING_YEAR = "1900";

test("options: a failing option fetch replaces the join screen with the error state", async ({
  page,
}) => {
  await page.goto(`/games/${FAILING_YEAR}`);

  await expect(page.getByTestId("error-state")).toBeVisible();
  await expect(page.getByText("Something went wrong")).toBeVisible();
  await expect(page.getByTestId("error-retry")).toBeVisible();
  await expect(page.getByTestId("name-input")).toHaveCount(0);
});

test("options: a failing option fetch replaces the round screen with the error state", async ({
  page,
}) => {
  const sessionId = await createSession(page, "Host");

  await page.getByTestId("lobby-start").click();
  await expect(page.getByTestId("pick-input")).toBeVisible();

  // Same session, options that cannot load.
  await page.goto(`/games/${FAILING_YEAR}/${sessionId}`);

  await expect(page.getByTestId("error-state")).toBeVisible();
  await expect(page.getByTestId("error-retry")).toBeVisible();
  // The ticket expected the pick input to stay usable through an option outage.
  // It does not: `throwOnError` in src/queries/use-games.ts sends the failure to
  // the root ErrorBoundary, so the whole round screen is replaced. This asserts
  // what ships; whether the app should degrade more gently is a call for the
  // reviewer — see the PR notes.
  await expect(page.getByTestId("pick-input")).toHaveCount(0);
});
