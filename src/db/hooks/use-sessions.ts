import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";

import type { Session } from "types/session";

export function useSession(sessionId: string | undefined) {
  const session = useQuery(
    api.sessions.getSession,
    sessionId ? { sessionId: sessionId as Id<"sessions"> } : "skip",
  );

  return {
    session: (session as Session) ?? null,
    isLoading: session === undefined,
    isError: null,
  };
}
