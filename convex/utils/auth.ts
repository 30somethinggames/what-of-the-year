import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export async function requireSessionMember(ctx: QueryCtx, sessionId: Id<"sessions">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  const player = await ctx.db
    .query("players")
    .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", identity.subject))
    .unique();

  if (!player) throw new Error("Not a session member");

  return identity;
}
