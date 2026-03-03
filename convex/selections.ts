import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";

export const getSelections = query({
  args: { sessionId: v.id("sessions"), number: v.number() },
  handler: async (ctx, { sessionId, number }) => {
    const round = await ctx.db
      .query("rounds")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("number"), number))
      .unique();

    if (!round) return [];

    const selections = await ctx.db
      .query("selections")
      .withIndex("by_round_uid", (q) => q.eq("roundId", round._id))
      .collect();

    return selections;
  },
});

type MySelectionResult = { roundNumber: number } & Doc<"selections">;

export const getMySelections = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const uid = identity.subject;

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    const results: MySelectionResult[] = [];

    for (const round of rounds) {
      const sel = (await ctx.db
        .query("selections")
        .withIndex("by_round_uid", (q) => q.eq("roundId", round._id).eq("uid", uid))
        .unique()) as Doc<"selections"> | null;
      if (sel) {
        results.push({ roundNumber: round.number, ...sel });
      }
    }

    results.sort((a, b) => a.roundNumber - b.roundNumber);
    return results;
  },
});
