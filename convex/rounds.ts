import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getRound = query({
  args: { sessionId: v.id("sessions"), number: v.number() },
  handler: async (ctx, { sessionId, number }) => {
    const round = await ctx.db
      .query("rounds")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("number"), number))
      .unique();

    return round ?? null;
  },
});

export const advanceRound = mutation({
  args: {
    sessionId: v.id("sessions"),
    currentRoundNumber: v.number(),
  },
  handler: async (ctx, { sessionId, currentRoundNumber }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const currentRound = await ctx.db
      .query("rounds")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("number"), currentRoundNumber))
      .unique();

    if (!currentRound) throw new Error("Round not found");

    await ctx.db.patch(currentRound._id, {
      state: "closed",
      closedAt: Date.now(),
    });

    const hasNextRound = currentRoundNumber > 1;

    if (hasNextRound) {
      const nextRoundNumber = currentRoundNumber - 1;

      const nextRound = await ctx.db
        .query("rounds")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .filter((q) => q.eq(q.field("number"), nextRoundNumber))
        .unique();

      if (!nextRound) throw new Error("Next round not found");

      await ctx.db.patch(nextRound._id, {
        state: "open",
        startedAt: Date.now(),
      });

      await ctx.db.patch(sessionId, {
        activeRoundNumber: nextRoundNumber,
      });
    }

    return { hasNextRound };
  },
});
