import { expect, test, type Page } from "@playwright/test";

import { seedGame, seedLobby, signIn } from "../helpers/convex";

const YEAR = 2026;

/** Where a seeded session lives, given the topic and year it was seeded with. */
function sessionUrl(sessionId: string) {
  return `/games/${YEAR}/${sessionId}`;
}

/**
 * The page signs itself in, so the seed can hand it the identity it already
 * has — see `currentUid` in `playwright/helpers/convex.ts` for why it goes in
 * that direction and not the other.
 */
async function hostFor(page: Page, name: string) {
  return { name, uid: await signIn(page) };
}

test("seed: a lobby the host lands in without filling the setup form", async ({ page }) => {
  const uid = await signIn(page);
  const { sessionId, hostUid } = await seedLobby({ name: "Host", year: YEAR, hostUid: uid });

  expect(hostUid).toBe(uid);

  await page.goto(sessionUrl(sessionId));

  await expect(page.getByTestId("lobby-start")).toBeVisible();
  await expect(page.getByTestId("name-input")).toHaveCount(0);
  await expect(page.getByTestId("player-count")).toHaveText("1 of 10");
});

test("seed: a round in play, without walking the rounds before it", async ({ page }) => {
  const host = await hostFor(page, "Host");
  const { sessionId } = await seedGame({
    phase: "round:8",
    year: YEAR,
    players: [host, { name: "Guest" }],
  });

  await page.goto(sessionUrl(sessionId));

  await expect(page.getByText("Round 8")).toBeVisible();
  await expect(page.getByTestId("pick-input")).toBeVisible();
});

test("seed: a reveal already running, with the picks it reveals", async ({ page }) => {
  const host = await hostFor(page, "Host");
  const guestUid = "seeded-guest";

  const { sessionId } = await seedGame({
    phase: "revealing:10",
    year: YEAR,
    players: [host, { name: "Guest", uid: guestUid }],
    selections: [
      { uid: host.uid, roundNumber: 10, pickName: "Blue Prince" },
      { uid: guestUid, roundNumber: 10, pickName: "Balatro" },
    ],
  });

  await page.goto(sessionUrl(sessionId));

  await expect(page.getByTestId("reveal-container")).toBeVisible();
  await expect(page.getByTestId("reveal-countdown")).toBeVisible();
  // The host drives the reveal, so the skip button is the host-only proof that
  // the seeded uid really is the identity this page holds.
  await expect(page.getByTestId("reveal-skip")).toBeVisible();
});

test("seed: results without playing ten rounds to reach them", async ({ page }) => {
  const host = await hostFor(page, "Host");

  const { sessionId } = await seedGame({
    phase: "ended",
    year: YEAR,
    players: [host, { name: "Guest", uid: "seeded-guest" }],
    selections: [
      { uid: host.uid, roundNumber: 10, pickName: "Blue Prince" },
      { uid: host.uid, roundNumber: 9, pickName: "Balatro" },
    ],
  });

  await page.goto(sessionUrl(sessionId));

  await expect(page.getByTestId("results-list")).toBeVisible();
  await expect(page.getByText("Blue Prince")).toBeVisible();
  await expect(page.getByText("Balatro")).toBeVisible();
  await expect(page.getByTestId("pick-input")).toHaveCount(0);
});
