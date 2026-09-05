import type { SessionID } from "db/types";
import { useMySelections } from "db/use-my-selections";
import { usePlayers } from "db/use-players";
import { useRound } from "db/use-round";
import { useSelections } from "db/use-selections";
import { useSession } from "db/use-sessions";

interface Props {
  sessionId: SessionID;
}

export function useRoundState({ sessionId }: Props) {
  const { isLoading: sessionLoading, session, activeRound } = useSession(sessionId);
  const { round } = useRound(sessionId, activeRound);
  const { mySelections } = useMySelections(sessionId);
  const { players, isHost } = usePlayers(sessionId);
  const { selections } = useSelections(sessionId, activeRound);

  const isLoading = !session && sessionLoading;
  const isRevealing = round?.state === "revealing";

  const hasPickedThisRound = activeRound
    ? mySelections.some((s) => s.roundNumber === activeRound)
    : false;

  return {
    isLoading,
    session,
    round,
    mySelections,
    hasPickedThisRound,
    isRevealing,
    selections,
    players,
    isHost,
  };
}
