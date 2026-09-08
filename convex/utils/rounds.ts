import type { Doc, Id } from "../_generated/dataModel";
import type { DatabaseReader } from "../_generated/server";

/**
 * Whether a round's picks may leave the server. Until the round starts
 * revealing, every pick is secret — clients only learn who has picked.
 */
export function isRoundRevealed(round: Doc<"rounds">) {
  return round.state === "revealing" || round.state === "closed";
}

/**
 * How long a reveal runs before `completeReveal` closes the round — long enough
 * for every player's pick to be shown in turn. Shared with the test seed so a
 * seeded `revealing` round times out exactly like one `advanceRound` opened.
 */
export function revealDurationMs(playerCount: number) {
  return playerCount * 4_000 + 5_000;
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
