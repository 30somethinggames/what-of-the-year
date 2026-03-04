import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { SessionID } from "db/types";

/**
 * Subscribes to the players list and current user's player doc for a session in real time.
 *
 * Automatically skips subscribing if `sessionId` is undefined.
 *
 * @param sessionId - The session to listen to. Pass `undefined` to skip subscribing.
 * @returns An object containing the `players` array, `currentUser` player doc, `isHost` flag, and an `isLoading` flag.
 */
export function usePlayers(sessionId: SessionID | undefined) {
  const players = useQuery(api.players.getPlayers, sessionId ? { sessionId } : "skip");
  const currentUser = useQuery(api.players.getMyPlayer, sessionId ? { sessionId } : "skip");

  return {
    isLoading: players === undefined || currentUser === undefined,
    players: players ?? [],
    currentUser,
    isHost: currentUser?.isHost ?? false,
  };
}
