import { usePlayers } from "db/use-players";
import { useSession } from "db/use-sessions";
import { useGameOver } from "hooks/use-game-over";
import type { SessionID } from "types/backend";

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
