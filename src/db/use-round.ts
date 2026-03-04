import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { SessionID } from "db/types";

/**
 * Subscribes to a single round document in real time.
 *
 * Automatically skips subscribing if `sessionId` or `roundNumber` is undefined.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @param roundNumber - The round number. Pass `undefined` to skip subscribing.
 * @returns An object containing the `round` data and an `isLoading` flag.
 */
export function useRound(sessionId: SessionID | undefined, roundNumber: number | undefined) {
  const round = useQuery(
    api.rounds.getRound,
    sessionId && roundNumber ? { sessionId, number: roundNumber } : "skip",
  );

  return {
    isLoading: round === undefined,
    round: round ?? null,
  };
}
