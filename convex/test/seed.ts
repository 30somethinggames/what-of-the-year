// internal: test-only seeding; plain Error throws are fine here (never reachable on prod)
import { v } from "convex/values";

import { internalMutation } from "../_generated/server";
import { MAX_ROUNDS } from "../constants";
import { getRoundByNumber } from "../utils/rounds";
import { pickId, seedSession, testUid } from "./phases";

const playerArg = v.object({
  name: v.string(),
  avatar: v.optional(v.string()),
  // Supply one to make a browser the player: an anonymous identity is minted by
  // the deployment and signed with a key the suite never holds, so a uid the
  // seed invented can never be adopted by a page. See `signInAs` in
  // `playwright/helpers/convex.ts`.
  uid: v.optional(v.string()),
});

const selectionArg = v.object({
  uid: v.string(),
  roundNumber: v.number(),
  pickName: v.string(),
});

/** A LOBBY session with one named host — what `createSession` produces. */
export const createSession = internalMutation({
  args: {
    topic: v.optional(v.string()),
    year: v.optional(v.number()),
    name: v.string(),
    avatar: v.optional(v.string()),
    hostUid: v.optional(v.string()),
  },
  handler: async (ctx, { topic, year, name, avatar, hostUid }) => {
    const game = await seedSession(ctx, {
      topic,
      year,
      phase: "lobby",
      players: [{ name, avatar, uid: hostUid }],
    });

    return { sessionId: game.sessionId, hostUid: game.players[0]!.uid };
  },
});

/** A session at any phase, with its players and their picks already in place. */
export const seedGame = internalMutation({
  args: {
    topic: v.optional(v.string()),
    year: v.optional(v.number()),
    phase: v.string(),
    players: v.array(playerArg),
    selections: v.optional(v.array(selectionArg)),
  },
  handler: async (ctx, { topic, year, phase, players, selections }) =>
    await seedSession(ctx, { topic, year, phase, players, selections }),
});

export const addPlayer = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.string(),
    avatar: v.string(),
  },
  handler: async (ctx, { sessionId, name, avatar }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");

    const uid = testUid();

    await ctx.db.insert("players", {
      sessionId,
      uid,
      name,
      avatar,
      isHost: false,
    });

    await ctx.db.patch(sessionId, {
      playerCount: session.playerCount + 1,
    });

    return { uid };
  },
});

export const makeSelection = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    uid: v.string(),
    roundNumber: v.number(),
    pickName: v.string(),
  },
  handler: async (ctx, { sessionId, uid, roundNumber, pickName }) => {
    const round = await getRoundByNumber(ctx.db, sessionId, roundNumber);
    if (!round) throw new Error("Round not found");

    await ctx.db.insert("selections", {
      sessionId,
      roundId: round._id,
      uid,
      pick: {
        id: pickId(pickName),
        name: pickName,
      },
      points: MAX_ROUNDS + 1 - roundNumber,
      roundNumber,
      savedAt: Date.now(),
    });

    const selectionsComplete = round.selectionsComplete + 1;
    await ctx.db.patch(round._id, { selectionsComplete });

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");

    const allComplete = selectionsComplete >= session.playerCount;

    if (allComplete) {
      await ctx.db.patch(round._id, { state: "closed", closedAt: Date.now() });

      if (roundNumber > 1) {
        const nextRound = await getRoundByNumber(ctx.db, sessionId, roundNumber - 1);
        if (nextRound) {
          await ctx.db.patch(nextRound._id, { state: "open", startedAt: Date.now() });
          await ctx.db.patch(sessionId, { activeRoundNumber: roundNumber - 1 });
        }
      }
    }
  },
});

export const cleanup = internalMutation({
  handler: async (ctx) => {
    const tables = ["sessions", "players", "rounds", "selections"] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      await Promise.all(docs.map((doc) => ctx.db.delete(doc._id)));
    }
  },
});
