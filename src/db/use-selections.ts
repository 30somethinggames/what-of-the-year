import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import type { SessionID } from "db/types";

/**
 * Subscribes to all selections for a given round in real time.
 *
 * Automatically skips subscribing if `sessionId` or `roundNumber` is undefined.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @param roundNumber - The round number. Pass `undefined` to skip subscribing.
 * @returns An object containing the `selections` array and an `isLoading` flag.
 */
export function useSelections(sessionId: SessionID | undefined, roundNumber: number | undefined) {
  const selections = useQuery(
    api.selections.getSelections,
    sessionId && roundNumber ? { sessionId, number: roundNumber } : "skip",
  );

  return {
    isLoading: selections === undefined,
    selections: selections ?? [],
  };
}
