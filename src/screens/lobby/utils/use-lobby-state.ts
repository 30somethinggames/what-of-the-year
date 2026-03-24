import { useNavigate } from "@tanstack/react-router";
import { SessionStatus } from "convex/constants";
import { useEffect } from "react";

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
    if (!isLoading && session && session.status === SessionStatus.ACTIVE && !isHost) {
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
  }, [isLoading, session?.status, isHost, topic.value, year, sessionId]);

  return {
    isLoading,
    session,
    players,
    currentUser,
    isHost,
    maxPlayerCount,
  };
}
