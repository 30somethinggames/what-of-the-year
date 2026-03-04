import type { Id } from "../_generated/dataModel";
import type { DatabaseReader } from "../_generated/server";

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
