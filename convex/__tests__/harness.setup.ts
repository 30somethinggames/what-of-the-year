import { Glob } from "bun";

import { convexTest } from "convex-test";

import type { Id } from "../_generated/dataModel";
import { MAX_PLAYERS, MAX_ROUNDS, SessionStatus } from "../constants";
import schema from "../schema";

// `convex-test` normally discovers modules via Vite's `import.meta.glob`, which
// Bun does not implement — build the equivalent `path -> loader` map by hand.
// The file is named `*.setup.ts` so `convex deploy` skips it (two dots).
const CONVEX_ROOT = new URL("../", import.meta.url).pathname;
const RATE_LIMITER_ROOT = new URL(
  "../../node_modules/@convex-dev/rate-limiter/src/component/",
  import.meta.url,
).pathname;

function moduleMap(root: string) {
  const modules: Record<string, () => Promise<unknown>> = {};

  for (const path of new Glob("**/*.{ts,js}").scanSync({ cwd: root })) {
    if (path.endsWith(".d.ts") || path.includes(".test.") || path.startsWith("__tests__/"))
      continue;
    modules[`./${path}`] = () => import(root + path);
  }

  return modules;
}

/** A `convex-test` instance with the rate limiter component registered. */
export async function setupTest() {
  const t = convexTest(schema, moduleMap(CONVEX_ROOT));
  const rateLimiterSchema = (await import(`${RATE_LIMITER_ROOT}schema.ts`)).default;

  t.registerComponent("rateLimiter", rateLimiterSchema, moduleMap(RATE_LIMITER_ROOT));

  return t;
}

export const HOST_UID = "host-uid";
export const MEMBER_UID = "member-uid";
export const OUTSIDER_UID = "outsider-uid";

type TestConvex = Awaited<ReturnType<typeof setupTest>>;

export type SeededGame = {
  sessionId: Id<"sessions">;
  roundIds: Id<"rounds">[];
};

/**
 * An ACTIVE session with a host, one other member, and `MAX_ROUNDS` rounds
 * where the highest-numbered round is `open` (matching `startSession`).
 */
export async function seedActiveGame(t: TestConvex): Promise<SeededGame> {
  return await t.run(async (ctx) => {
    const sessionId = await ctx.db.insert("sessions", {
      topic: "games",
      year: 2025,
      maxRounds: MAX_ROUNDS,
      maxPlayers: MAX_PLAYERS,
      playerCount: 2,
      activeRoundNumber: MAX_ROUNDS,
      status: SessionStatus.ACTIVE,
    });

    await ctx.db.insert("players", {
      sessionId,
      uid: HOST_UID,
      name: "Host",
      avatar: "🐙",
      isHost: true,
    });
    await ctx.db.insert("players", {
      sessionId,
      uid: MEMBER_UID,
      name: "Member",
      avatar: "🦊",
      isHost: false,
    });

    const roundIds: Id<"rounds">[] = [];

    for (let number = 1; number <= MAX_ROUNDS; number++) {
      const isActive = number === MAX_ROUNDS;
      roundIds.push(
        await ctx.db.insert("rounds", {
          sessionId,
          number,
          state: isActive ? "open" : "pending",
          weight: MAX_ROUNDS + 1 - number,
          selectionsComplete: 0,
          startedAt: isActive ? Date.now() : null,
          closedAt: null,
        }),
      );
    }

    return { sessionId, roundIds };
  });
}

/**
 * A LOBBY session with a host, one other member, and `MAX_ROUNDS` `pending`
 * rounds (matching `createSession`).
 */
export async function seedLobbyGame(t: TestConvex): Promise<SeededGame> {
  const game = await seedActiveGame(t);

  await t.run(async (ctx) => {
    await ctx.db.patch(game.sessionId, {
      status: SessionStatus.LOBBY,
      activeRoundNumber: 1,
    });
    await ctx.db.patch(game.roundIds[MAX_ROUNDS - 1], { state: "pending", startedAt: null });
  });

  return game;
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
