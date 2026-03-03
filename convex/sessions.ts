import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const MAX_ROUNDS = 10;
const MAX_PLAYERS = 10;

export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db.get(sessionId);
  },
});

export const createSession = mutation({
  args: {
    topic: v.string(),
    year: v.number(),
    name: v.string(),
    avatar: v.string(),
  },
  handler: async (ctx, { topic, year, name, avatar }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const uid = identity.subject;

    const sessionId = await ctx.db.insert("sessions", {
      topic,
      year,
      maxRounds: MAX_ROUNDS,
      maxPlayers: MAX_PLAYERS,
      isOpen: true,
      playerCount: 1,
      activeRoundNumber: 1,
    });

    await ctx.db.insert("players", {
      sessionId,
      uid,
      name,
      avatar,
      isHost: true,
    });

    const rounds = Array.from({ length: MAX_ROUNDS }, (_, i) => ({
      number: i + 1,
      state: "pending" as const,
      weight: MAX_ROUNDS + 1 - (i + 1),
      selectionsComplete: 0,
      startedAt: null,
      closedAt: null,
    }));

    for (const round of rounds) {
      await ctx.db.insert("rounds", {
        sessionId,
        ...round,
      });
    }

    return { sessionId };
  },
});

export const startSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");

    const host = await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", identity.subject))
      .unique();

    if (!host?.isHost) throw new Error("Only the host can start the session");

    const round = await ctx.db
      .query("rounds")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("number"), MAX_ROUNDS))
      .unique();

    if (!round) throw new Error("Round not found");

    await ctx.db.patch(sessionId, {
      isOpen: false,
      activeRoundNumber: MAX_ROUNDS,
    });

    await ctx.db.patch(round._id, {
      state: "active",
      startedAt: Date.now(),
    });
  },
});
