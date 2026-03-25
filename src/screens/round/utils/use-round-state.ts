import { useEffect } from "react";

import type { SessionID } from "db/types";
import { useMySelections } from "db/use-my-selections";
import { usePlayers } from "db/use-players";
import { useRound } from "db/use-round";
import { useSession } from "db/use-sessions";
import { useGameOver } from "hooks/use-game-over";

interface Props {
  sessionId: SessionID;
  topic: string;
  year: string;
}

export function useRoundState({ sessionId, topic, year }: Props) {
  const { isLoading: sessionLoading, session, activeRound } = useSession(sessionId);
  const { round } = useRound(sessionId, activeRound);
  const { mySelections } = useMySelections(sessionId);
  const { isHost } = usePlayers(sessionId);

  const isLoading = !session && sessionLoading;

  useGameOver({ isHost, session });

  useEffect(() => {
    if (!activeRound) return;
    window.history.replaceState(null, "", `/${topic}/${year}/${sessionId}/${activeRound}`);
  }, [activeRound, sessionId, topic, year]);

  const hasPickedThisRound = activeRound
    ? mySelections.some((s) => s.roundNumber === activeRound)
    : false;

  return {
    isLoading,
    session,
    round,
    mySelections,
    hasPickedThisRound,
  };
}
