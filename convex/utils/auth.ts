import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { apiError } from "./errors";

export async function requireSessionMember(ctx: QueryCtx, sessionId: Id<"sessions">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw apiError("UNAUTHENTICATED", "Unauthenticated");

  const player = await ctx.db
    .query("players")
    .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", identity.subject))
    .unique();

  if (!player) throw apiError("NOT_MEMBER", "Player not in session");

  return identity;
}
