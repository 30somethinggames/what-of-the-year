import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function useSession(sessionId: Id<"sessions"> | undefined) {
  const session = useQuery(api.sessions.getSession, sessionId ? { sessionId } : "skip");

  return {
    isLoading: session === undefined,
    isError: null,
    session: session ?? null,
  };
}
