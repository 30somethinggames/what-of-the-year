import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { SessionID } from "db/types";

export function useSession(sessionId: SessionID | undefined) {
  const session = useQuery(api.sessions.getSession, sessionId ? { sessionId } : "skip");

  const activeRound = session?.activeRoundNumber;

  return {
    isLoading: session === undefined,
    session: session ?? null,
    activeRound,
  };
}
