import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { sessionRef } from "db/collections";
import type { Session } from "types/session";

/**
 * Subscribes to a single session document in real time.
 *
 * The subscription is automatically cleaned up when the component unmounts or
 * `sessionId` changes. If the document does not exist, `error` is set.
 *
 * @param sessionId - The session to listen to. Pass `undefined` to skip subscribing.
 * @returns An object containing the `session` data, an `isLoading` flag, and any `error`.
 */
export function useSession(sessionId: string | undefined) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = onSnapshot(
      sessionRef(sessionId),
      (snapshot) => {
        if (snapshot.exists()) {
          setSession(snapshot.data() as Session);
        } else {
          setIsError(new Error("Session not found"));
        }
        setIsLoading(false);
      },
      (err) => {
        setIsError(err);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [sessionId]);

  return { session, isLoading, isError };
}
