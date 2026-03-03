import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { SessionID } from "db/types";

export function usePlayers(sessionId: SessionID | undefined) {
  const players = useQuery(api.players.getPlayers, sessionId ? { sessionId } : "skip");
  const currentUser = useQuery(api.auth.getViewer);
  const isHost = players?.some((p) => p.uid === currentUser?.subject && p.isHost) ?? false;

  return {
    isLoading: players === undefined || currentUser === undefined,
    isError: null,
    isHost,
    currentUser,
    players: players ?? [],
  };
}
