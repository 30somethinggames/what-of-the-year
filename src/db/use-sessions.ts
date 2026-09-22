import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
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

/** Creates a session for a topic and year, with the caller as host. */
export function useCreateSession() {
  return useMutation(api.sessions.createSession);
}

/** Flips a lobby to ACTIVE and opens its first round. */
export function useStartSession() {
  return useMutation(api.sessions.startSession);
}

/** Ends a session the host is walking away from. */
export function useForfeitSession() {
  return useMutation(api.sessions.forfeitSession);
}
