import { Glob } from "bun";

import { convexTest } from "convex-test";

import { MAX_ROUNDS } from "../constants";
import schema from "../schema";
import type { Phase, SeededGame } from "../test/phases";
import { seedSession } from "../test/phases";

// `convex-test` normally discovers modules via Vite's `import.meta.glob`, which
// Bun does not implement — build the equivalent `path -> loader` map by hand.
// The file is named `*.setup.ts` so `convex deploy` skips it (two dots).
const CONVEX_ROOT = new URL("../", import.meta.url).pathname;
const RATE_LIMITER_ROOT = new URL(
  "../../node_modules/@convex-dev/rate-limiter/src/component/",
  import.meta.url,
).pathname;

function moduleMap(root: string, httpSuffix = "") {
  const modules: Record<string, () => Promise<unknown>> = {};

  for (const path of new Glob("**/*.{ts,js}").scanSync({ cwd: root })) {
    if (path.endsWith(".d.ts") || path.includes(".test.") || path.startsWith("__tests__/"))
      continue;
    const specifier = root + path + (path === "http.ts" ? httpSuffix : "");
    modules[`./${path}`] = () => import(specifier);
  }

  return modules;
}

/**
 * `convex/http.ts` decides at module evaluation which `/test/*` routes exist,
 * so a test that changes `TEST_SECRET` or `IS_PROD` has to get past bun's
 * module cache. A distinct specifier is the only way; everything http.ts
 * imports stays shared.
 */
let httpGeneration = 0;

interface SetupOptions {
  /** Evaluate `convex/http.ts` again, against the environment set right now. */
  freshHttp?: boolean;
}

/** A `convex-test` instance with the rate limiter component registered. */
export async function setupTest({ freshHttp = false }: SetupOptions = {}) {
  const t = convexTest(
    schema,
    moduleMap(CONVEX_ROOT, freshHttp ? `?http=${++httpGeneration}` : ""),
  );
  const rateLimiterSchema = (await import(`${RATE_LIMITER_ROOT}schema.ts`)).default;

  t.registerComponent("rateLimiter", rateLimiterSchema, moduleMap(RATE_LIMITER_ROOT));

  return t;
}

export const HOST_UID = "host-uid";
export const MEMBER_UID = "member-uid";
export const OUTSIDER_UID = "outsider-uid";

type TestConvex = Awaited<ReturnType<typeof setupTest>>;

export type { SeededGame };

/** The two players every harness seed carries: `HOST_UID` hosts, `MEMBER_UID` joins. */
const PLAYERS = [
  { name: "Host", avatar: "🐙", uid: HOST_UID },
  { name: "Member", avatar: "🦊", uid: MEMBER_UID },
];

/**
 * The phases below go through the same `seedSession` the `/test/seed-game`
 * route uses, so a unit test and an e2e spec are looking at the same rows.
 */
function seedPhase(t: TestConvex, phase: Phase) {
  return t.run((ctx) => seedSession(ctx, { phase, players: PLAYERS }));
}

/**
 * An ACTIVE session with a host, one other member, and `MAX_ROUNDS` rounds
 * where the highest-numbered round is `open` (matching `startSession`).
 */
export async function seedActiveGame(t: TestConvex): Promise<SeededGame> {
  return await seedPhase(t, `round:${MAX_ROUNDS}`);
}

/**
 * A LOBBY session with a host, one other member, and `MAX_ROUNDS` `pending`
 * rounds (matching `createSession`).
 */
export async function seedLobbyGame(t: TestConvex): Promise<SeededGame> {
  return await seedPhase(t, "lobby");
}

/**
 * An ACTIVE session on its final round: round 1 is `open`, every other round
 * is `closed`, and `activeRoundNumber` is 1 (the state `completeReveal` leaves
 * after round 2).
 */
export async function seedFinalRound(t: TestConvex): Promise<SeededGame> {
  return await seedPhase(t, "round:1");
}

/**
 * A COMPLETE session: every round `closed`, `activeRoundNumber` 1 (the state
 * `completeReveal` leaves after round 1).
 */
export async function seedCompleteGame(t: TestConvex): Promise<SeededGame> {
  return await seedPhase(t, "ended");
}

export const OPTION = {
  id: 1234,
  name: "Blue Prince",
  cover: "cover.jpg",
  rating: 90,
  first_release_date: 1_744_000_000,
  summary: "A house of many doors.",
};

/** A saved `OPTION` pick by `uid` on the highest-numbered round. */
export async function seedSelection(t: TestConvex, game: SeededGame, uid: string) {
  await t.run(async (ctx) => {
    await ctx.db.insert("selections", {
      sessionId: game.sessionId,
      roundId: game.roundIds[MAX_ROUNDS - 1],
      uid,
      pick: { id: String(OPTION.id), name: OPTION.name },
      points: 1,
      roundNumber: MAX_ROUNDS,
      savedAt: Date.now(),
    });
  });
}
