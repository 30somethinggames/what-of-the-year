import type { Id } from "../_generated/dataModel";
import type { ActionCtx, QueryCtx } from "../_generated/server";
import { rateLimiter } from "../ratelimits";
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

/**
 * Guard for the option actions (`getMovies`/`getGames`/`getBooks`): auth, then a
 * per-user rate limit so a signed-in caller can't burn third-party quota or
 * action minutes in a loop.
 *
 * No membership step — options are picked on the topic/year screen before a
 * session exists, so there is no session to be a member of.
 */
export async function requireOptionsAccess(
  ctx: ActionCtx,
  name: "getMovies" | "getGames" | "getBooks",
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw apiError("UNAUTHENTICATED", "Unauthenticated");

  await rateLimiter.limit(ctx, name, { key: identity.subject, throws: true });
}
