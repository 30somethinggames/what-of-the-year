import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { SessionID } from "db/types";
import { useSession } from "db/use-sessions";

export function useResultsState({ sessionId }: { sessionId: SessionID }) {
  const { session, isLoading: sessionLoading } = useSession(sessionId);
  const results = useQuery(
    api.selections.getResults,
    sessionId ? { sessionId: sessionId as Id<"sessions"> } : "skip",
  );

  return {
    isLoading: sessionLoading || results === undefined,
    session,
    results: results ?? [],
  };
}
