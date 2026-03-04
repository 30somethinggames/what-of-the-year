import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { SessionID } from "db/types";

/**
 * Subscribes to a single session document in real time.
 *
 * Automatically skips subscribing if `sessionId` is undefined.
 *
 * @param sessionId - The session to listen to. Pass `undefined` to skip subscribing.
 * @returns An object containing the `session` data, `activeRound` number, and an `isLoading` flag.
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
