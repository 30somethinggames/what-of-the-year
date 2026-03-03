import { v } from "convex/values";

import { query } from "./_generated/server";

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
