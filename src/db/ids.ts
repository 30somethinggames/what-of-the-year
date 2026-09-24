import type { Id } from "convex/_generated/dataModel";
import type { SessionID } from "types/backend";

/** The contract's ids are plain strings; Convex's carry a table brand. */
export function toSessionId(id: SessionID): Id<"sessions"> {
  return id as Id<"sessions">;
}
