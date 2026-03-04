import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";

/**
 * Subscribes to all selections across all rounds for a session in real time.
 *
 * Automatically skips subscribing if `sessionId` is undefined.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @returns An object containing the `allSelections` array and an `isLoading` flag.
 */
export function useAllSelections(sessionId: string | undefined) {
  const selections = useQuery(
    api.selections.getAllSelections,
    sessionId ? { sessionId: sessionId as Id<"sessions"> } : "skip",
  );

  return {
    allSelections: selections ?? [],
    isLoading: selections === undefined,
  };
}
