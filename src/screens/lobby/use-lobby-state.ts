import { router } from "expo-router";
import { useEffect } from "react";

import type { LobbyProps } from "./types";
import { usePlayers } from "db/hooks/use-players";
import { useSession } from "db/hooks/use-session";

/**
 * Composite hook for managing lobby state.
 *
 * Combines session and player data, handles loading/error states,
 * and automatically navigates non-host players to round 1 when the host starts the game.
 */
export function useLobbyState({ sessionId, topic, year }: LobbyProps) {
  const { session, isLoading: sessionLoading, error: sessionError } = useSession(sessionId);
  const {
    players,
    currentUser,
    isHost,
    isLoading: playersLoading,
    error: playersError,
  } = usePlayers(sessionId);

  const isLoading = sessionLoading || playersLoading;
  const error = sessionError || playersError;

  const playerCount = players.length;
  const maxPlayerCount = session?.maxPlayers;
  const canStart = playerCount < 2;

  // Auto-navigate non-host players when game starts
  useEffect(() => {
    if (!isLoading && !error && session && !session.isOpen && !isHost) {
      router.replace({
        pathname: "/[topic]/[year]/[sessionId]/[round]",
        params: { topic: topic.value, year, sessionId, round: "1" },
      });
    }
  }, [session?.isOpen, isHost, isLoading, error, topic.value, year, sessionId]);

  return {
    isLoading,
    error,
    session,
    currentUser,
    players,
    isHost,
    playerCount,
    maxPlayerCount,
    canStart,
  };
}
