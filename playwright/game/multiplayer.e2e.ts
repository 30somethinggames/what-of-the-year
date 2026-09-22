import { expect, test } from "@playwright/test";
import { testIds } from "test-ids";

import { addPlayer, makeSelection, seedGame, signIn } from "../helpers/convex";

const YEAR = 2026;

test("multiplayer: host flow with advance-round", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/");

  // Home → Setup
  await page.getByTestId(testIds.home.start).click();
  await page.getByTestId(testIds.topic.nameInput).pressSequentially("Host Player");
  await expect(page.getByTestId(testIds.topic.submit)).toBeEnabled();
  await page.getByTestId(testIds.topic.submit).click();

  // Lobby — read session ID, verify host state
  await expect(page.getByText("Host Player")).toBeVisible();
  await expect(page.getByText("Host", { exact: true })).toBeVisible();
  await expect(page.getByTestId(testIds.lists.playerCount)).toBeVisible();

  const sessionId = await page.getByTestId(testIds.lobby.sessionId).getAttribute("data-value");
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

  await page.getByTestId(testIds.lobby.start).click();

  // Round 10 — host picks, others submit via API
  await expect(page.getByText("Round 10")).toBeVisible();
  await page.getByTestId(testIds.round.pickInput).fill("a");
  await expect(page.getByTestId(testIds.autocomplete.suggestion).first()).toBeVisible();
  await page.getByTestId(testIds.autocomplete.suggestion).first().click();
  await expect(page.getByTestId(testIds.round.submitPick)).toBeEnabled();

  await page.getByTestId(testIds.round.submitPick).click();
  await expect(page.getByTestId(testIds.round.submitPick)).toBeDisabled();

  // Round 10 is still open (others have not picked) — the pick can be edited
  await page.getByTestId(testIds.lists.editPick).click();
  await expect(page.getByTestId(testIds.round.cancelEdit)).toBeVisible();
  await expect(page.getByTestId(testIds.round.submitPick)).toBeEnabled();
  await page.getByTestId(testIds.round.submitPick).click();
  await expect(page.getByTestId(testIds.round.cancelEdit)).toHaveCount(0);
  await expect(page.getByTestId(testIds.round.submitPick)).toContainText("Enter");

  await makeSelection({ sessionId, uid: player2Uid, roundNumber: 10, pickName: "Elden Ring" });
  await makeSelection({ sessionId, uid: player3Uid, roundNumber: 10, pickName: "Elden Ring" });

  // Round 9
  await expect(page.getByText("Round 9")).toBeVisible();
  await page.getByTestId(testIds.round.pickInput).fill("b");
  await expect(page.getByTestId(testIds.autocomplete.suggestion).first()).toBeVisible();
  await page.getByTestId(testIds.autocomplete.suggestion).first().click();
  await expect(page.getByTestId(testIds.round.submitPick)).toBeEnabled();

  await page.getByTestId(testIds.round.submitPick).click();
  await expect(page.getByTestId(testIds.round.submitPick)).toBeDisabled();

  await makeSelection({ sessionId, uid: player2Uid, roundNumber: 9, pickName: "Zelda" });
  await makeSelection({ sessionId, uid: player3Uid, roundNumber: 9, pickName: "Mario" });

  // Round 8 — player 3 unresponsive, host advances via sidebar
  await expect(page.getByText("Round 8")).toBeVisible();
  await page.getByTestId(testIds.round.pickInput).fill("c");
  await expect(page.getByTestId(testIds.autocomplete.suggestion).first()).toBeVisible();
  await page.getByTestId(testIds.autocomplete.suggestion).first().click();
  await expect(page.getByTestId(testIds.round.submitPick)).toBeEnabled();

  await page.getByTestId(testIds.round.submitPick).click();
  await expect(page.getByTestId(testIds.round.submitPick)).toBeDisabled();

  await makeSelection({ sessionId, uid: player2Uid, roundNumber: 8, pickName: "Hades" });

  // Open sidebar and advance round 8 (host + player 2 picked — reveal runs)
  await page.getByTestId(testIds.settings.button).click();
  await expect(page.getByTestId(testIds.sidebar.title)).toBeVisible();
  await expect(page.getByTestId(testIds.sidebar.advanceRound)).toBeVisible();
  await page.getByTestId(testIds.sidebar.advanceRound).click();

  // Close sidebar to see the reveal, then skip it
  await page.getByTestId(testIds.sidebar.close).click();
  await expect(page.getByTestId(testIds.reveal.container)).toBeVisible();
  await expect(page.getByTestId(testIds.reveal.skip)).toBeVisible();
  await page.getByTestId(testIds.reveal.skip).click();

  // Advance rounds 7–2 via sidebar (no picks made — advances directly, no reveal)
  await expect(page.getByText("Round 7")).toBeVisible();
  await page.getByTestId(testIds.settings.button).click();
  await expect(page.getByTestId(testIds.sidebar.title)).toBeVisible();
  for (let round = 7; round >= 2; round--) {
    await expect(page.getByText(`Round ${round}`)).toBeVisible();
    await expect(page.getByTestId(testIds.sidebar.advanceRound)).toBeVisible();
    await page.getByTestId(testIds.sidebar.advanceRound).click();
  }

  // Round 1 — End Game (no picks, advances directly to results)
  await expect(page.getByText("Round 1")).toBeVisible();
  await expect(page.getByText("End Game")).toBeVisible();
  await page.getByTestId(testIds.sidebar.advanceRound).click();

  // Results
  await expect(page.getByTestId(testIds.results.list)).toBeVisible();
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
  await expect(guestPage.getByTestId(testIds.round.pickInput)).toBeVisible();

  // The host watches the list while the round is still open — with two players
  // and only one pick in, nothing closes the round.
  await hostPage.getByTestId(testIds.settings.button).click();
  await expect(hostPage.getByTestId(testIds.sidebar.title)).toBeVisible();

  const guestRow = hostPage.getByText("Melissa").locator("..");
  const hostRow = hostPage.getByText("Ryan").locator("..");
  await expect(guestRow).toContainText("...");

  // Guest picks in their own browser
  await guestPage.getByTestId(testIds.round.pickInput).fill("a");
  await expect(guestPage.getByTestId(testIds.autocomplete.suggestion).first()).toBeVisible();
  await guestPage.getByTestId(testIds.autocomplete.suggestion).first().click();
  await expect(guestPage.getByTestId(testIds.round.submitPick)).toBeEnabled();
  await guestPage.getByTestId(testIds.round.submitPick).click();

  // Host's list marks the guest done and leaves the host, who has not picked,
  // as they were
  await expect(guestRow).toContainText("✓");
  await expect(hostRow).toContainText("...");

  await hostContext.close();
  await guestContext.close();
});
