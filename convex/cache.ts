import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Read/write halves of the `apiCache` table. Actions have no `ctx.db`, so the
 * option actions reach these through the `utils/cache` helpers.
 */

export const read = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const entry = await ctx.db
      .query("apiCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (!entry || entry.expiresAt <= Date.now()) return null;

    return entry.value;
  },
});

export const write = internalMutation({
  args: { key: v.string(), value: v.any(), expiresAt: v.number() },
  handler: async (ctx, { key, value, expiresAt }) => {
    const entry = await ctx.db
      .query("apiCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (entry) {
      await ctx.db.patch(entry._id, { value, expiresAt });
      return;
    }

    await ctx.db.insert("apiCache", { key, value, expiresAt });
  },
});
