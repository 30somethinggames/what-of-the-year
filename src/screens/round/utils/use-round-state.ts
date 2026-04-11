import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import type { SessionID } from "db/types";
import { useMySelections } from "db/use-my-selections";
import { usePlayers } from "db/use-players";
import { useRound } from "db/use-round";
import { useSelections } from "db/use-selections";
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
  const { round } = useRound(sessionId, activeRound);
  const { mySelections } = useMySelections(sessionId);
  const { players, isHost } = usePlayers(sessionId);
  const { selections } = useSelections(sessionId, activeRound);

  const isLoading = !session && sessionLoading;
  const isRevealing = round?.state === "revealing";

  useGameOver({ isHost, session });

  useEffect(() => {
    if (!activeRound) return;
    window.history.replaceState(null, "", `/${topic}/${year}/${sessionId}/${activeRound}`);
  }, [activeRound, sessionId, topic, year]);

  useEffect(() => {
    if (activeRound === 1 && round?.state === "closed") {
      navigate({
        to: "/$topic/$year/$sessionId/results",
        params: { topic, year, sessionId },
        replace: true,
      });
    }
  }, [activeRound, round?.state, navigate, topic, year, sessionId]);

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
