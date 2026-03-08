import { SessionStatus } from "convex/constants";
import { router } from "expo-router";
import { useEffect } from "react";

import { usePlayers } from "db/use-players";
import { useSession } from "db/use-sessions";
import { useGameOver } from "hooks/use-game-over";

import type { LobbyProps } from "./types";

/**
 * Composite hook for managing lobby state.
 *
 * Combines session and player data, handles loading/error states,
 * and automatically navigates non-host players to round MAX_ROUNDS when the host starts the game.
 */
export function useLobbyState({ sessionId, topic, year }: LobbyProps) {
  const { isLoading: sessionLoading, session } = useSession(sessionId);
  const { isLoading: playersLoading, players, isHost } = usePlayers(sessionId);

  const isLoading = sessionLoading || playersLoading;

  const maxPlayerCount = session?.maxPlayers;

  useGameOver({ isHost, session });

  // Auto-navigate non-host players when game starts
  useEffect(() => {
    if (!isLoading && session && session.status === SessionStatus.ACTIVE && !isHost) {
      router.replace({
        pathname: "/[topic]/[year]/[sessionId]/[round]",
        params: { topic: topic.value, year, sessionId, round: String(session.activeRoundNumber) },
      });
    }
  }, [isLoading, session?.status, isHost, topic.value, year, sessionId]);

  return {
    isLoading,
    session,
    players,
    isHost,
    maxPlayerCount,
  };
}
