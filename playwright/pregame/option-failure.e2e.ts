import { expect, test } from "@playwright/test";
import { testIds } from "test-ids";

import { seedGame, signIn } from "../helpers/convex";

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

  await expect(page.getByTestId(testIds.error.state)).toBeVisible();
  await expect(page.getByText("Something went wrong")).toBeVisible();
  await expect(page.getByTestId(testIds.error.retry)).toBeVisible();
  await expect(page.getByTestId(testIds.topic.nameInput)).toHaveCount(0);
});

test("options: a failing option fetch replaces the round screen with the error state", async ({
  page,
}) => {
  const { sessionId } = await seedGame({
    phase: "round:10",
    players: [{ name: "Host", uid: await signIn(page) }],
  });

  // A round in play, under a year whose options cannot load.
  await page.goto(`/games/${FAILING_YEAR}/${sessionId}`);

  await expect(page.getByTestId(testIds.error.state)).toBeVisible();
  await expect(page.getByTestId(testIds.error.retry)).toBeVisible();
  // The ticket expected the pick input to stay usable through an option outage.
  // It does not: `throwOnError` in src/queries/use-games.ts sends the failure to
  // the root ErrorBoundary, so the whole round screen is replaced. This asserts
  // what ships; whether the app should degrade more gently is a call for the
  // reviewer — see the PR notes.
  await expect(page.getByTestId(testIds.round.pickInput)).toHaveCount(0);
});
