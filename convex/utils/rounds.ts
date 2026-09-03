import type { Doc, Id } from "../_generated/dataModel";
import type { DatabaseReader } from "../_generated/server";

/**
 * Whether a round's picks may leave the server. Until the round starts
 * revealing, every pick is secret — clients only learn who has picked.
 */
export function isRoundRevealed(round: Doc<"rounds">) {
  return round.state === "revealing" || round.state === "closed";
}

export async function getRoundByNumber(
  db: DatabaseReader,
  sessionId: Id<"sessions">,
  number: number,
) {
  return await db
    .query("rounds")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .filter((q) => q.eq(q.field("number"), number))
    .unique();
}
