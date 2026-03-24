import { useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
  const { isLoading: sessionLoading, session, activeRound } = useSession(sessionId);
  const { isLoading: roundLoading, round } = useRound(sessionId, activeRound);
  const { isLoading: mySelectionsLoading, mySelections } = useMySelections(sessionId);
  const { isLoading: playersLoading, isHost } = usePlayers(sessionId);

  const isLoading = sessionLoading || roundLoading || mySelectionsLoading || playersLoading;

  useGameOver({ isHost, session });

  useEffect(() => {
    if (!round || !activeRound) return;
    if (activeRound === 1 && round.number === 1 && round.state === "closed") {
      navigate({
        to: "/$topic/$year/$sessionId/results",
        params: { topic, year, sessionId },
        replace: true,
      });
    }
  }, [round?.number, round?.state, activeRound, sessionId, topic, year]);

  const hasPickedThisRound = activeRound
    ? mySelections.some((s) => s.roundNumber === activeRound)
    : false;

  return {
    isLoading,
    session,
    round,
    activeRound,
    mySelections,
    hasPickedThisRound,
  };
}
