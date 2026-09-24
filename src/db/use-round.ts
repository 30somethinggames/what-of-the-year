import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Backend } from "types/backend";

import { toSessionId } from "./ids";

export const useRound: Backend["useRound"] = (sessionId, roundNumber) => {
  const round = useQuery(
    api.rounds.getRound,
    sessionId && roundNumber ? { sessionId: toSessionId(sessionId), number: roundNumber } : "skip",
  );

  return {
    isLoading: round === undefined,
    round: round ?? null,
  };
};

/** Host-only: moves the round on — open to revealing, revealing to closed with the next round opened. */
export const useAdvanceRound: Backend["useAdvanceRound"] = () => {
  const advance = useMutation(api.rounds.advanceRound);
  return ({ sessionId, currentRoundNumber }) =>
    advance({ sessionId: toSessionId(sessionId), currentRoundNumber });
};
