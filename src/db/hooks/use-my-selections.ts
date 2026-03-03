import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { SessionID } from "db/types";

/**
 * Subscribes to the current user's selection docs across all rounds (1..maxRounds).
 *
 * Each round's selection doc is subscribed independently so updates are real-time.
 * Results are sorted ascending by round number so the most recently played round
 * (lowest number, since rounds count down from maxRounds) appears first.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @param maxRounds - Total number of rounds in the session.
 */
export function useMySelections(sessionId: SessionID | undefined) {
  const data = useQuery(api.selections.getMySelections, sessionId ? { sessionId } : "skip");
  const viewer = useQuery(api.auth.getViewer);

  const uid = viewer?.subject ?? null;
  const isLoading = data === undefined || viewer === undefined;

  return { mySelections: data ?? [], uid, isLoading };
}
