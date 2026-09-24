import { useResults } from "db/use-selections";
import { useSession } from "db/use-sessions";
import type { SessionID } from "types/backend";

export function useResultsState({ sessionId }: { sessionId: SessionID }) {
  const { session, isLoading: sessionLoading } = useSession(sessionId);
  const { results, isLoading: resultsLoading } = useResults(sessionId);

  return {
    isLoading: sessionLoading || resultsLoading,
    session,
    results,
  };
}
