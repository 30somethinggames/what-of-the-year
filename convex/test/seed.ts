import { v } from "convex/values";

import { internalMutation } from "../_generated/server";
import { MAX_ROUNDS } from "../constants";
import { getRoundByNumber } from "../utils/rounds";

export const addPlayer = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.string(),
    avatar: v.string(),
  },
  handler: async (ctx, { sessionId, name, avatar }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");

    const uid = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
        id: pickName.toLowerCase().replace(/\s+/g, "-"),
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
