import { router } from "expo-router";
import { useEffect } from "react";

import { MAX_ROUNDS } from "constants/session";
import { usePlayers } from "db/hooks/use-players";
import { useSession } from "db/hooks/use-sessions";
import { isDev } from "utils/dev/isDev";

import type { LobbyProps } from "./types";

/**
 * Composite hook for managing lobby state.
 *
 * Combines session and player data, handles loading/error states,
 * and automatically navigates non-host players to round MAX_ROUNDS when the host starts the game.
 */
export function useLobbyState({ sessionId, topic, year }: LobbyProps) {
  const { session, isLoading: sessionLoading, isError: sessionError } = useSession(sessionId);
  const {
    isLoading: playersLoading,
    isError: playersError,
    players,
    currentUser,
    isHost,
  } = usePlayers(sessionId);

  const isLoading = sessionLoading || playersLoading;
  const isError = sessionError || playersError;

  const playerCount = players.length;
  const maxPlayerCount = session?.maxPlayers;
  const isDisabled = isDev ? false : playerCount < 2;

  // Auto-navigate non-host players when game starts
  useEffect(() => {
    if (!isLoading && !isError && session && !session.isOpen && !isHost) {
      router.replace({
        pathname: "/[topic]/[year]/[sessionId]/[round]",
        params: { topic: topic.value, year, sessionId, round: String(MAX_ROUNDS) },
      });
    }
  }, [session?.isOpen, isHost, isLoading, isError, topic.value, year, sessionId]);

  return {
    isLoading,
    isError,
    session,
    currentUser,
    players,
    isHost,
    playerCount,
    maxPlayerCount,
    isDisabled,
  };
}
