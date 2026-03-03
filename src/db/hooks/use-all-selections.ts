import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { selectionsRef } from "db/collections";
import type { Selection } from "db/types";

export interface PlayerRoundSelection extends Selection {
  uid: string;
  roundNumber: number;
}

/**
 * Subscribes to all selections across all rounds for all players.
 *
 * Each round's selections collection is subscribed independently so updates
 * are real-time. Returns a flat array of all selections with the round number
 * attached.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @param maxRounds - Total number of rounds in the session.
 */
export function useAllSelections(sessionId: string | undefined, maxRounds: number) {
  const [selectionsMap, setSelectionsMap] = useState<Record<number, PlayerRoundSelection[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId || maxRounds === 0) {
      setIsLoading(false);
      return;
    }

    let loadedCount = 0;
    const unsubscribes: (() => void)[] = [];

    for (let round = 1; round <= maxRounds; round++) {
      const ref = selectionsRef(sessionId, round);
      const unsub = onSnapshot(
        ref,
        (snapshot) => {
          const data: PlayerRoundSelection[] = snapshot.docs.map((doc) => ({
            // uid: doc.id,
            roundNumber: round,
            ...(doc.data() as Selection),
          }));
          setSelectionsMap((prev) => ({ ...prev, [round]: data }));
          loadedCount++;
          if (loadedCount >= maxRounds) setIsLoading(false);
        },
        (err) => {
          setIsError(err);
          setIsLoading(false);
        },
      );
      unsubscribes.push(unsub);
    }

    return () => {
      for (const unsub of unsubscribes) unsub();
    };
  }, [sessionId, maxRounds]);

  const allSelections: PlayerRoundSelection[] = Object.values(selectionsMap).flat();

  return { allSelections, isLoading, isError };
}
