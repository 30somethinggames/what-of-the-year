import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { selectionsRef } from "db/collections";
import type { Selection } from "types/session";

export interface SelectionWithUid extends Selection {
  uid: string;
}

/**
 * Subscribes to all selections for a given round in real time.
 *
 * The subscription is automatically cleaned up when the component unmounts or
 * parameters change.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @param roundNumber - The round number. Pass `undefined` to skip subscribing.
 * @returns An object containing the `selections` array, an `isLoading` flag, and any `error`.
 */
export function useSelections(sessionId: string | undefined, roundNumber: number | undefined) {
  const [selections, setSelections] = useState<SelectionWithUid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId || !roundNumber) return;

    const unsubscribe = onSnapshot(
      selectionsRef(sessionId, roundNumber),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...(doc.data() as Selection),
        }));
        setSelections(data);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [sessionId, roundNumber]);

  return { selections, isLoading, error };
}
