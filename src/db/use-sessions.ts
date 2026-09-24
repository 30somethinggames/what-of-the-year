import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Backend } from "types/backend";

import { toSessionId } from "./ids";

export const useSession: Backend["useSession"] = (sessionId) => {
  const session = useQuery(
    api.sessions.getSession,
    sessionId ? { sessionId: toSessionId(sessionId) } : "skip",
  );

  const activeRound = session?.activeRoundNumber;

  return {
    isLoading: session === undefined,
    session: session ?? null,
    activeRound,
  };
};

/** Creates a session for a topic and year, with the caller as host. */
export const useCreateSession: Backend["useCreateSession"] = () =>
  useMutation(api.sessions.createSession);

/** Flips a lobby to ACTIVE and opens its first round. */
export const useStartSession: Backend["useStartSession"] = () => {
  const start = useMutation(api.sessions.startSession);
  return ({ sessionId }) => start({ sessionId: toSessionId(sessionId) });
};

/** Ends a session the host is walking away from. */
export const useForfeitSession: Backend["useForfeitSession"] = () => {
  const forfeit = useMutation(api.sessions.forfeitSession);
  return ({ sessionId }) => forfeit({ sessionId: toSessionId(sessionId) });
};
