import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { SessionStatus } from "convex/constants";
import { usePlayers } from "db/use-players";
import { useSession } from "db/use-sessions";
import { useGameOver } from "hooks/use-game-over";

import type { LobbyProps } from "../types";

export function useLobbyState({ sessionId, topic, year }: LobbyProps) {
  const navigate = useNavigate();
  const { isLoading: sessionLoading, session } = useSession(sessionId);
  const { isLoading: playersLoading, players, currentUser, isHost } = usePlayers(sessionId);

  const isLoading = sessionLoading || playersLoading;
  const maxPlayerCount = session?.maxPlayers;

  useGameOver({ isHost, session });

  useEffect(() => {
    if (!isLoading && session && session.status === SessionStatus.ACTIVE) {
      navigate({
        to: "/$topic/$year/$sessionId/$round",
        params: {
          topic: topic.value,
          year,
          sessionId,
          round: String(session.activeRoundNumber),
        },
        replace: true,
      });
    }
  }, [isLoading, session?.status, topic.value, year, sessionId]);

  return {
    isLoading,
    session,
    players,
    currentUser,
    isHost,
    maxPlayerCount,
  };
}
