import { expect, test } from "@playwright/test";

import { addPlayer, makeSelection, seedGame, signIn } from "../helpers/convex";

const YEAR = 2026;

test("multiplayer: host flow with advance-round", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/");

  // Home → Setup
  await page.getByTestId("home-start").click();
  await page.getByTestId("name-input").pressSequentially("Host Player");
  await expect(page.getByTestId("setup-submit")).toBeEnabled();
  await page.getByTestId("setup-submit").click();

  // Lobby — read session ID, verify host state
  await expect(page.getByText("Host Player")).toBeVisible();
  await expect(page.getByText("Host", { exact: true })).toBeVisible();
  await expect(page.getByTestId("player-count")).toBeVisible();

  const sessionId = await page.locator('[data-testid="session-id"]').getAttribute("data-value");
  if (!sessionId) throw new Error("Could not read session ID");

  // Add players via API
  const { uid: player2Uid } = await addPlayer({
    sessionId,
    name: "Player 2",
    avatar: "🎮",
  });
  await expect(page.getByText("Player 2")).toBeVisible();

  const { uid: player3Uid } = await addPlayer({
    sessionId,
    name: "Player 3",
    avatar: "🎲",
  });
  await expect(page.getByText("Player 3")).toBeVisible();

  await page.getByTestId("lobby-start").click();

  // Round 10 — host picks, others submit via API
  await expect(page.getByText("Round 10")).toBeVisible();
  await page.getByTestId("pick-input").fill("a");
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();

  await page.getByTestId("submit-pick").click();
  await expect(page.getByTestId("submit-pick")).toBeDisabled();

  // Round 10 is still open (others have not picked) — the pick can be edited
  await page.getByTestId("edit-pick").click();
  await expect(page.getByTestId("cancel-edit")).toBeVisible();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();
  await page.getByTestId("submit-pick").click();
  await expect(page.getByTestId("cancel-edit")).toHaveCount(0);
  await expect(page.getByTestId("submit-pick")).toContainText("Enter");

  await makeSelection({ sessionId, uid: player2Uid, roundNumber: 10, pickName: "Elden Ring" });
  await makeSelection({ sessionId, uid: player3Uid, roundNumber: 10, pickName: "Elden Ring" });

  // Round 9
  await expect(page.getByText("Round 9")).toBeVisible();
  await page.getByTestId("pick-input").fill("b");
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();

  await page.getByTestId("submit-pick").click();
  await expect(page.getByTestId("submit-pick")).toBeDisabled();

  await makeSelection({ sessionId, uid: player2Uid, roundNumber: 9, pickName: "Zelda" });
  await makeSelection({ sessionId, uid: player3Uid, roundNumber: 9, pickName: "Mario" });

  // Round 8 — player 3 unresponsive, host advances via sidebar
  await expect(page.getByText("Round 8")).toBeVisible();
  await page.getByTestId("pick-input").fill("c");
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();

  await page.getByTestId("submit-pick").click();
  await expect(page.getByTestId("submit-pick")).toBeDisabled();

  await makeSelection({ sessionId, uid: player2Uid, roundNumber: 8, pickName: "Hades" });

  // Open sidebar and advance round 8 (host + player 2 picked — reveal runs)
  await page.getByTestId("settings-button").click();
  await expect(page.getByTestId("sidebar-title")).toBeVisible();
  await expect(page.getByTestId("advance-round")).toBeVisible();
  await page.getByTestId("advance-round").click();

  // Close sidebar to see the reveal, then skip it
  await page.getByTestId("close-sidebar").click();
  await expect(page.getByTestId("reveal-container")).toBeVisible();
  await expect(page.getByTestId("reveal-skip")).toBeVisible();
  await page.getByTestId("reveal-skip").click();

  // Advance rounds 7–2 via sidebar (no picks made — advances directly, no reveal)
  await expect(page.getByText("Round 7")).toBeVisible();
  await page.getByTestId("settings-button").click();
  await expect(page.getByTestId("sidebar-title")).toBeVisible();
  for (let round = 7; round >= 2; round--) {
    await expect(page.getByText(`Round ${round}`)).toBeVisible();
    await expect(page.getByTestId("advance-round")).toBeVisible();
    await page.getByTestId("advance-round").click();
  }

  // Round 1 — End Game (no picks, advances directly to results)
  await expect(page.getByText("Round 1")).toBeVisible();
  await expect(page.getByText("End Game")).toBeVisible();
  await page.getByTestId("advance-round").click();

  // Results
  await expect(page.getByTestId("results-list")).toBeVisible();
  await expect(page.getByText("Elden Ring")).toBeVisible();
  await expect(page.getByText("Zelda")).toBeVisible();
  await expect(page.getByText("Mario")).toBeVisible();
  await expect(page.getByText("Hades")).toBeVisible();
  await expect(page.getByText(/\d+pts/).first()).toBeVisible();
});

test("multiplayer: a guest's pick reaches the host's player list", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  // Each page signs itself in before the seed runs — a page can only be handed
  // an identity it already holds, see `currentUid` in helpers/convex.ts.
  const hostUid = await signIn(hostPage);
  const guestUid = await signIn(guestPage);

  const { sessionId } = await seedGame({
    phase: "round:10",
    year: YEAR,
    players: [
      { name: "Ryan", uid: hostUid },
      { name: "Melissa", uid: guestUid },
    ],
  });

  await hostPage.goto(`/games/${YEAR}/${sessionId}`);
  await guestPage.goto(`/games/${YEAR}/${sessionId}`);
  await expect(guestPage.getByTestId("pick-input")).toBeVisible();

  // The host watches the list while the round is still open — with two players
  // and only one pick in, nothing closes the round.
  await hostPage.getByTestId("settings-button").click();
  await expect(hostPage.getByTestId("sidebar-title")).toBeVisible();

  const guestRow = hostPage.getByText("Melissa").locator("..");
  const hostRow = hostPage.getByText("Ryan").locator("..");
  await expect(guestRow).toContainText("...");

  // Guest picks in their own browser
  await guestPage.getByTestId("pick-input").fill("a");
  await expect(guestPage.getByTestId("suggestion-item").first()).toBeVisible();
  await guestPage.getByTestId("suggestion-item").first().click();
  await expect(guestPage.getByTestId("submit-pick")).toBeEnabled();
  await guestPage.getByTestId("submit-pick").click();

  // Host's list marks the guest done and leaves the host, who has not picked,
  // as they were
  await expect(guestRow).toContainText("✓");
  await expect(hostRow).toContainText("...");

  await hostContext.close();
  await guestContext.close();
});
