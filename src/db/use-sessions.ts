import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { SessionID } from "db/types";

/**
 * Subscribes to a session in real time.
 *
 * Any signed-in caller may read it, member or not: the session id is the
 * invite, so a player holding the link reads the session before joining. It
 * and the membership probe in `usePlayers` are the only reads that do not
 * reject a non-member. `session` is null once the session is gone.
 *
 * Automatically skips subscribing if `sessionId` is undefined.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @returns An object containing the `session`, its `activeRound` number, and an `isLoading` flag.
 */
export function useSession(sessionId: SessionID | undefined) {
  const session = useQuery(api.sessions.getSession, sessionId ? { sessionId } : "skip");

  const activeRound = session?.activeRoundNumber;

  return {
    isLoading: session === undefined,
    session: session ?? null,
    activeRound,
  };
}

/** Any signed-in caller: creates a session for a topic and year, with the caller as host. */
export function useCreateSession() {
  return useMutation(api.sessions.createSession);
}

/** Host-only, from the lobby: flips it to ACTIVE and opens its first round. */
export function useStartSession() {
  return useMutation(api.sessions.startSession);
}

/** Host-only, in any state but forfeited: ends a session the host is walking away from. */
export function useForfeitSession() {
  return useMutation(api.sessions.forfeitSession);
}
