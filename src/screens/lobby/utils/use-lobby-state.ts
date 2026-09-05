import type { SessionID } from "db/types";
import { usePlayers } from "db/use-players";
import { useSession } from "db/use-sessions";

interface Props {
  sessionId: SessionID;
}

export function useLobbyState({ sessionId }: Props) {
  const { isLoading: sessionLoading, session } = useSession(sessionId);
  const { isLoading: playersLoading, players, currentUser, isHost } = usePlayers(sessionId);

  const isLoading = sessionLoading || playersLoading;
  const maxPlayerCount = session?.maxPlayers;

  return {
    isLoading,
    session,
    players,
    currentUser,
    isHost,
    maxPlayerCount,
  };
}
