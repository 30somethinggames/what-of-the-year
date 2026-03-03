import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { SessionID } from "db/types";

/**
 * Subscribes to a single round document in real time.
 *
 * The subscription is automatically cleaned up when the component unmounts or
 * parameters change. If the document does not exist, `error` is set.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @param roundNumber - The round number. Pass `undefined` to skip subscribing.
 * @returns An object containing the `round` data, an `isLoading` flag.
 */
export function useRound(sessionId: SessionID | undefined, roundNumber: number | undefined) {
  const round = useQuery(
    api.rounds.getRound,
    sessionId && roundNumber ? { sessionId, number: roundNumber } : "skip",
  );

  return {
    round: round ?? null,
    isLoading: round === undefined,
  };
}
