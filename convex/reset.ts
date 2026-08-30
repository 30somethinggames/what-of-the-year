import { internalMutation } from "./_generated/server";
import { isProd } from "./utils/env";

export const clearAll = internalMutation({
  handler: async (ctx) => {
    // Runtime guard, independent of cron registration: also blocks a manual dashboard run.
    if (isProd()) throw new Error("Refusing to clear data on a prod deployment");

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
