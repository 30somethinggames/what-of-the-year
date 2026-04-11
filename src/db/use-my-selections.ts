import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import type { SessionID } from "db/types";

/**
 * Subscribes to the current user's selections across all rounds in real time.
 *
 * Results are sorted ascending by round number.
 * Automatically skips subscribing if `sessionId` is undefined.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @returns An object containing the `mySelections` array and an `isLoading` flag.
 */
export function useMySelections(sessionId: SessionID | undefined) {
  const data = useQuery(api.selections.getMySelections, sessionId ? { sessionId } : "skip");

  return {
    isLoading: data === undefined,
    mySelections: data ?? [],
  };
}
