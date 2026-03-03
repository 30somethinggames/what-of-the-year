import { internalMutation } from "./_generated/server";

export const clearAll = internalMutation({
  handler: async (ctx) => {
    const tables = [
      "sessions",
      "players",
      "rounds",
      "selections",
      "authAccounts",
      "authSessions",
      "authVerificationCodes",
      "authVerifiers",
      "authRateLimits",
      "users",
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      await Promise.all(docs.map((doc) => ctx.db.delete(doc._id)));
    }
  },
});
