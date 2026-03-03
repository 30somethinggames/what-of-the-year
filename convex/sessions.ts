import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { MAX_PLAYERS, MAX_ROUNDS } from "./constants";

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

export const joinSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.string(),
    avatar: v.string(),
  },
  handler: async (ctx, { sessionId, name, avatar }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const uid = identity.subject;

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");
    if (!session.isOpen) throw new Error("Session is closed");
    if (session.playerCount >= session.maxPlayers) throw new Error("Session is full");

    // Check if already joined
    const existing = await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", uid))
      .unique();
    if (existing) throw new Error("Already joined this session");

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
  },
});

export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db.get(sessionId);
  },
});
