import type { SessionID } from "db/types";
import { usePlayers } from "db/use-players";
import { useSession } from "db/use-sessions";
import { useGameOver } from "hooks/use-game-over";

interface Props {
  sessionId: SessionID;
}

export function useSessionState({ sessionId }: Props) {
  const { isLoading: sessionLoading, session } = useSession(sessionId);
  const { isHost } = usePlayers(sessionId);

  const isLoading = !session && sessionLoading;

  useGameOver({ isHost, session });

  return { isLoading, session };
}
