import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { roundRef } from "db/collections";
import type { Round } from "types/session";

/**
 * Subscribes to a single round document in real time.
 *
 * The subscription is automatically cleaned up when the component unmounts or
 * parameters change. If the document does not exist, `error` is set.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @param roundNumber - The round number. Pass `undefined` to skip subscribing.
 * @returns An object containing the `round` data, an `isLoading` flag, and any `error`.
 */
export function useRound(sessionId: string | undefined, roundNumber: number | undefined) {
  const [round, setRound] = useState<Round | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId || !roundNumber) return;

    const unsubscribe = onSnapshot(
      roundRef(sessionId, roundNumber),
      (snapshot) => {
        if (snapshot.exists()) {
          setRound(snapshot.data() as Round);
        } else {
          setError(new Error("Round not found"));
        }
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [sessionId, roundNumber]);

  return { round, isLoading, error };
}
