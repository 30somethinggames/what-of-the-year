import type { SessionID } from "db/types";
import { useResults } from "db/use-selections";
import { useSession } from "db/use-sessions";

export function useResultsState({ sessionId }: { sessionId: SessionID }) {
  const { session, isLoading: sessionLoading } = useSession(sessionId);
  const { results, isLoading: resultsLoading } = useResults(sessionId);

  return {
    isLoading: sessionLoading || resultsLoading,
    session,
    results,
  };
}
