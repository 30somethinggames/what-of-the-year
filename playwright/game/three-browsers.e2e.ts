import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { seedGame, signIn } from "../helpers/convex";

const YEAR = 2026;

/** The rounds this spec plays, in the order they open. Rounds count down. */
const ROUNDS = [3, 2, 1];

/**
 * A player, the letter it types each round and the pick that letter brings up.
 * The options are the deterministic fixtures (`OPTIONS_FIXTURES`), one title
 * per letter, so every page picks something no other page can pick.
 */
const PLAYERS = [
  {
    name: "Ryan",
    picks: [
      { letter: "d", name: "Delta Quest", points: "8pts" },
      { letter: "e", name: "Echo Quest", points: "9pts" },
      { letter: "f", name: "Foxtrot Quest", points: "10pts" },
    ],
  },
  {
    name: "Melissa",
    picks: [
      { letter: "g", name: "Golf Quest", points: "8pts" },
      { letter: "h", name: "Hotel Quest", points: "9pts" },
      { letter: "i", name: "India Quest", points: "10pts" },
    ],
  },
  {
    name: "Sam",
    picks: [
      { letter: "j", name: "Juliett Quest", points: "8pts" },
      { letter: "k", name: "Kilo Quest", points: "9pts" },
      { letter: "l", name: "Lima Quest", points: "10pts" },
    ],
  },
];

/** Rounds 10 to 4, every player on the round's one pick, so the spec plays three. */
const SEEDED = [
  { round: 10, pick: "Blue Prince" },
  { round: 9, pick: "Balatro" },
  { round: 8, pick: "Hades" },
  { round: 7, pick: "Celeste" },
  { round: 6, pick: "Outer Wilds" },
  { round: 5, pick: "Myst" },
  { round: 4, pick: "Tunic" },
];

/**
 * The head of the results list. Three players on one pick makes a seeded round
 * worth three times its weight, and the highest a pick from rounds 3 to 1 can
 * reach is 10, so these four lead in this order whatever the table picks.
 */
const LEADERS = [
  { name: "Tunic", points: "21pts" },
  { name: "Myst", points: "18pts" },
  { name: "Outer Wilds", points: "15pts" },
  { name: "Celeste", points: "12pts" },
];

type Seat = { name: string; page: Page };

/** A player once it has a browser of its own and an identity to be seeded with. */
type Seated = (typeof PLAYERS)[number] & { context: BrowserContext; page: Page; uid: string };

/** The same assertion on every page, named by the player whose page fails it. */
async function onEveryPage(pages: Seat[], assert: (page: Page) => Promise<void>) {
  for (const { name, page } of pages) {
    await test.step(name, () => assert(page));
  }
}

async function submitPick(page: Page, letter: string) {
  await page.getByTestId("pick-input").fill(letter);
  await expect(page.getByTestId("suggestion-item").first()).toBeVisible();
  await page.getByTestId("suggestion-item").first().click();
  await expect(page.getByTestId("submit-pick")).toBeEnabled();
  await page.getByTestId("submit-pick").click();
}

function resultRows(page: Page) {
  return page.getByTestId("results-list").locator("> *");
}

test("three browsers: a table of three plays round 3 to the results screen", async ({
  browser,
}) => {
  // Nine picks through the UI and three reveals, across three browsers.
  test.slow();

  const table: Seated[] = [];
  for (const player of PLAYERS) {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Each page signs itself in before the seed runs — a page can only be handed
    // an identity it already holds, see `currentUid` in helpers/convex.ts.
    table.push({ ...player, context, page, uid: await signIn(page) });
  }

  const host = table[0]!;
  const guests = table.slice(1);

  const { sessionId } = await seedGame({
    phase: "round:3",
    year: YEAR,
    players: table.map(({ name, uid }) => ({ name, uid })),
    selections: SEEDED.flatMap(({ round, pick }) =>
      table.map(({ uid }) => ({ uid, roundNumber: round, pickName: pick })),
    ),
  });

  for (const { page } of table) await page.goto(`/games/${YEAR}/${sessionId}`);

  for (const [index, round] of ROUNDS.entries()) {
    await onEveryPage(table, (page) => expect(page.getByText(`Round ${round}`)).toBeVisible());

    for (const player of [host, guests[0]!]) {
      await submitPick(player.page, player.picks[index]!.letter);
      // The locked button is the server's word that the pick landed.
      await expect(player.page.getByTestId("submit-pick")).toBeDisabled();
    }

    // Two of three in: the round is still open, so no page is revealing.
    await onEveryPage(table, (page) => expect(page.getByTestId("reveal-container")).toHaveCount(0));

    await submitPick(guests[1]!.page, guests[1]!.picks[index]!.letter);

    await onEveryPage(table, (page) => expect(page.getByTestId("reveal-container")).toBeVisible());
    await onEveryPage(guests, (page) => expect(page.getByTestId("reveal-skip")).toHaveCount(0));

    await expect(host.page.getByTestId("reveal-skip")).toBeVisible();
    await host.page.getByTestId("reveal-skip").click();
  }

  await onEveryPage(table, (page) => expect(page.getByTestId("results-list")).toBeVisible());

  const rows = resultRows(host.page);
  await expect(rows).toHaveCount(SEEDED.length + table.length * ROUNDS.length);

  for (const [index, leader] of LEADERS.entries()) {
    await expect(rows.nth(index)).toContainText(leader.name);
    await expect(rows.nth(index)).toContainText(leader.points);
  }

  const order = await rows.allTextContents();

  for (const player of table) {
    for (const pick of player.picks) {
      expect(order.some((row) => row.includes(pick.name) && row.includes(pick.points))).toBe(true);
    }
  }

  // The same picks in the same order, page by page.
  for (const guest of guests) {
    await expect(resultRows(guest.page)).toHaveCount(order.length);
    expect(await resultRows(guest.page).allTextContents()).toEqual(order);
  }

  for (const { context } of table) await context.close();
});
