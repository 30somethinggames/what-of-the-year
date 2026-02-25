import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { selectionRef } from "db/collections";
import type { Selection } from "types/session";

import { auth } from "../config";

export interface MySelection extends Selection {
  roundNumber: number;
}

/**
 * Subscribes to the current user's selection docs across all rounds (1..maxRounds).
 *
 * Each round's selection doc is subscribed independently so updates are real-time.
 * Results are sorted ascending by round number so the most recently played round
 * (lowest number, since rounds count down from maxRounds) appears first.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @param maxRounds - Total number of rounds in the session.
 */
export function useMySelections(sessionId: string | undefined, maxRounds: number) {
  const [selectionsMap, setSelectionsMap] = useState<Map<number, Selection>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<Error | null>(null);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!sessionId || !uid || maxRounds === 0) {
      setIsLoading(false);
      return;
    }

    let loadedCount = 0;
    const unsubscribes: (() => void)[] = [];

    for (let round = 1; round <= maxRounds; round++) {
      const ref = selectionRef(sessionId, round, uid);
      const unsub = onSnapshot(
        ref,
        (snapshot) => {
          setSelectionsMap((prev) => {
            const next = new Map(prev);
            if (snapshot.exists()) {
              next.set(round, snapshot.data() as Selection);
            } else {
              next.delete(round);
            }
            return next;
          });
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
  }, [sessionId, uid, maxRounds]);

  // Sort ascending by round number — since rounds are played high→low,
  // ascending order puts the most recently played round first.
  const mySelections: MySelection[] = Array.from(selectionsMap.entries())
    .map(([roundNumber, selection]) => ({ roundNumber, ...selection }))
    .sort((a, b) => a.roundNumber - b.roundNumber);

  return { mySelections, uid, isLoading, isError };
}
