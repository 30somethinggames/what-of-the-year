import { expect, test } from "@playwright/test";
import { testIds } from "test-ids";

import { seedGame, signIn } from "../helpers/convex";

const YEAR = 2026;

test("sidebar: opens and closes via button and backdrop", async ({ page }) => {
  const { sessionId } = await seedGame({
    phase: "round:10",
    year: YEAR,
    players: [{ name: "Host", uid: await signIn(page) }],
  });

  await page.goto(`/games/${YEAR}/${sessionId}`);
  await expect(page.getByText("Round 10")).toBeVisible();

  // Sidebar is closed initially
  await expect(page.getByTestId(testIds.sidebar.title)).not.toBeVisible();

  // Open sidebar via settings button
  await page.getByTestId(testIds.settings.button).click();
  await expect(page.getByTestId(testIds.sidebar.title)).toBeVisible();
  await expect(page.getByTestId(testIds.sidebar.title)).toContainText("Players");
  await expect(page.getByTestId(testIds.sidebar.leaveGame)).toBeVisible();
  await expect(page.getByTestId(testIds.sidebar.advanceRound)).toBeVisible();

  // Close via ✕ button
  await page.getByTestId(testIds.sidebar.close).click();
  await expect(page.getByTestId(testIds.sidebar.title)).not.toBeVisible();

  // Reopen sidebar
  await page.getByTestId(testIds.settings.button).click();
  await expect(page.getByTestId(testIds.sidebar.title)).toBeVisible();

  // Close via backdrop click
  const backdrop = page.locator(".fixed.inset-0.z-40");
  await backdrop.click({ position: { x: 350, y: 300 } });
  await expect(page.getByTestId(testIds.sidebar.title)).not.toBeVisible();
});

test("kick: host kicks a player from the game sidebar", async ({ page }) => {
  const { sessionId } = await seedGame({
    phase: "round:10",
    year: YEAR,
    players: [
      { name: "Host", uid: await signIn(page) },
      { name: "Player 2", avatar: "🎮" },
      { name: "Player 3", avatar: "🎲" },
    ],
  });

  await page.goto(`/games/${YEAR}/${sessionId}`);
  await expect(page.getByText("Round 10")).toBeVisible();

  // Open sidebar
  await page.getByTestId(testIds.settings.button).click();
  await expect(page.getByTestId(testIds.sidebar.title)).toBeVisible();

  // Both players visible
  await expect(page.getByText("Player 2")).toBeVisible();
  await expect(page.getByText("Player 3")).toBeVisible();

  // Kick Player 2
  const player2Row = page.getByText("Player 2").locator("..");
  await player2Row.getByTestId(testIds.lists.kickPlayer).click();

  // Player 2 gone, Player 3 still there
  await expect(page.getByText("Player 2")).not.toBeVisible();
  await expect(page.getByText("Player 3")).toBeVisible();

  // Close sidebar
  await page.getByTestId(testIds.sidebar.close).click();
  await expect(page.getByTestId(testIds.sidebar.title)).not.toBeVisible();
});

test("kick: the kicked player's own screen reacts", async ({ browser }) => {
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

  // The guest is subscribed before the kick lands, so what follows is the kick
  // reaching a live page rather than a page loading after the fact.
  await expect(guestPage.getByText("Round 10")).toBeVisible();

  await hostPage.getByTestId(testIds.settings.button).click();
  await expect(hostPage.getByTestId(testIds.sidebar.title)).toBeVisible();
  await expect(hostPage.getByText("Melissa")).toBeVisible();

  await hostPage.getByText("Melissa").locator("..").getByTestId(testIds.lists.kickPlayer).click();

  // The kicked player's live queries throw NOT_MEMBER, which the root
  // ErrorBoundary turns into the error state with a way home.
  await expect(guestPage.getByTestId(testIds.error.state)).toBeVisible();
  await expect(guestPage.getByText("Player not in session")).toBeVisible();
  await expect(guestPage.getByTestId(testIds.error.home)).toBeVisible();

  // And the host's list drops them.
  await expect(hostPage.getByText("Melissa")).not.toBeVisible();

  await hostContext.close();
  await guestContext.close();
});

test("kick: a guest's sidebar has no remove ✕", async ({ page }) => {
  const { sessionId } = await seedGame({
    phase: "round:10",
    year: YEAR,
    players: [
      { name: "Ryan", avatar: "🎮" },
      { name: "Melissa", uid: await signIn(page) },
    ],
  });

  await page.goto(`/games/${YEAR}/${sessionId}`);
  await expect(page.getByText("Round 10")).toBeVisible();

  await page.getByTestId(testIds.settings.button).click();
  await expect(page.getByTestId(testIds.sidebar.title)).toBeVisible();
  await expect(page.getByText("Ryan")).toBeVisible();
  await expect(page.getByText("Melissa")).toBeVisible();

  await expect(page.getByTestId(testIds.lists.kickPlayer)).toHaveCount(0);
});
