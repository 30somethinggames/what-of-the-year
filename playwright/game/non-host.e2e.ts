import { expect, test } from "@playwright/test";
import { testIds } from "test-ids";

import { seedGame, signIn } from "../helpers/convex";
import { pickRound } from "../helpers/session";

const YEAR = 2026;

test("non-host: lobby UI and round experience", async ({ browser }) => {
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

  // Non-host lobby: sees Leave, no Invite or Start
  await expect(guestPage.getByTestId(testIds.lobby.leave)).toBeVisible();
  await expect(guestPage.getByTestId(testIds.lobby.invite)).not.toBeVisible();
  await expect(guestPage.getByTestId(testIds.lobby.start)).not.toBeVisible();

  // Host starts game
  await hostPage.getByTestId(testIds.lobby.start).click();
  await expect(hostPage.getByText("Round 10")).toBeVisible();

  // Non-host auto-redirects to round 10
  await expect(guestPage.getByText("Round 10")).toBeVisible();

  // Non-host opens sidebar — no advance button
  await guestPage.getByTestId(testIds.settings.button).click();
  await expect(guestPage.getByTestId(testIds.sidebar.title)).toBeVisible();
  await expect(guestPage.getByTestId(testIds.sidebar.leaveGame)).toBeVisible();
  await expect(guestPage.getByTestId(testIds.sidebar.advanceRound)).not.toBeVisible();

  // Close sidebar
  await guestPage.getByTestId(testIds.sidebar.close).click();
  await expect(guestPage.getByTestId(testIds.sidebar.title)).not.toBeVisible();

  // Non-host makes a pick
  await pickRound(guestPage, "a");

  // Host makes a pick → all submitted → reveal starts
  await pickRound(hostPage, "b");

  // Reveal phase: host sees skip button, non-host does not
  await expect(hostPage.getByTestId(testIds.reveal.container)).toBeVisible();
  await expect(hostPage.getByTestId(testIds.reveal.skip)).toBeVisible();
  await expect(guestPage.getByTestId(testIds.reveal.container)).toBeVisible();
  await expect(guestPage.getByTestId(testIds.reveal.skip)).not.toBeVisible();

  // Host skips reveal → both advance to round 9
  await hostPage.getByTestId(testIds.reveal.skip).click();
  await expect(guestPage.getByText("Round 9")).toBeVisible();
  await expect(hostPage.getByText("Round 9")).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});

test("non-host: leaving game removes player from host sidebar", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

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

  await expect(hostPage.getByText("Round 10")).toBeVisible();
  await expect(guestPage.getByText("Round 10")).toBeVisible();

  // Host opens sidebar — both players visible
  await hostPage.getByTestId(testIds.settings.button).click();
  await expect(hostPage.getByTestId(testIds.sidebar.title)).toBeVisible();
  await expect(hostPage.getByText("Melissa")).toBeVisible();
  await expect(hostPage.getByText("Ryan")).toBeVisible();

  // Guest leaves game via sidebar
  await guestPage.getByTestId(testIds.settings.button).click();
  await expect(guestPage.getByTestId(testIds.sidebar.leaveGame)).toBeVisible();
  await guestPage.getByTestId(testIds.sidebar.leaveGame).click();

  // Guest is redirected to home
  await expect(guestPage.getByTestId(testIds.home.start)).toBeVisible();

  // Host's sidebar updates — Guest is gone
  await expect(hostPage.getByText("Melissa")).not.toBeVisible();
  await expect(hostPage.getByText("Ryan")).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});

test("non-host: host leaving game shows toast and redirects to home", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  const hostUid = await signIn(hostPage);
  const guestUid = await signIn(guestPage);

  const { sessionId } = await seedGame({
    phase: "round:10",
    year: YEAR,
    players: [
      { name: "Host", uid: hostUid },
      { name: "Guest", uid: guestUid },
    ],
  });

  await hostPage.goto(`/games/${YEAR}/${sessionId}`);
  await guestPage.goto(`/games/${YEAR}/${sessionId}`);

  // The guest is subscribed before the host leaves, so what follows is the
  // forfeit reaching a live page rather than a page loading after the fact.
  await expect(guestPage.getByText("Round 10")).toBeVisible();

  // Host leaves game mid-round (triggers forfeitSession)
  await hostPage.getByTestId(testIds.settings.button).click();
  await expect(hostPage.getByTestId(testIds.sidebar.leaveGame)).toBeVisible();
  await hostPage.getByTestId(testIds.sidebar.leaveGame).click();
  await expect(hostPage.getByTestId(testIds.home.start)).toBeVisible();

  // Guest sees error toast and is redirected to home
  await expect(guestPage.getByTestId(testIds.toast.root)).toBeVisible();
  await expect(guestPage.getByTestId(testIds.toast.root)).toHaveText(
    "The host forfeited the game.",
  );
  await expect(guestPage.getByTestId(testIds.home.start)).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});

test("non-host: host advancing mid-game moves the guest's round", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  // Each page signs itself in before the seed runs — a page can only be handed
  // an identity it already holds, see `currentUid` in helpers/convex.ts.
  const hostUid = await signIn(hostPage);
  const guestUid = await signIn(guestPage);

  const { sessionId } = await seedGame({
    phase: "round:8",
    year: YEAR,
    players: [
      { name: "Ryan", uid: hostUid },
      { name: "Melissa", uid: guestUid },
    ],
  });

  await hostPage.goto(`/games/${YEAR}/${sessionId}`);
  await guestPage.goto(`/games/${YEAR}/${sessionId}`);

  // Both are on round 8 before the advance, so what follows is the advance
  // reaching a live guest page rather than a page loading after the fact.
  await expect(hostPage.getByText("Round 8")).toBeVisible();
  await expect(guestPage.getByText("Round 8")).toBeVisible();

  // Host advances from the sidebar. Nobody has picked, so the round advances
  // directly — no reveal to skip.
  await hostPage.getByTestId(testIds.settings.button).click();
  await expect(hostPage.getByTestId(testIds.sidebar.advanceRound)).toBeVisible();
  await hostPage.getByTestId(testIds.sidebar.advanceRound).click();

  await expect(guestPage.getByText("Round 7")).toBeVisible();
  await expect(hostPage.getByText("Round 7")).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});
