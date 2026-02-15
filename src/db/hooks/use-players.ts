import { onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import { auth } from "../config";
import { playersRef } from "db/collections";
import type { Player } from "types/session";

/**
 * Subscribes to the players collection for a given session in real time.
 *
 * Players are ordered by `joinedAt` ascending. The subscription is
 * automatically cleaned up when the component unmounts or `sessionId` changes.
 *
 * @param sessionId - The session to listen to. Pass `undefined` to skip subscribing.
 * @returns An object containing the `players` array, an `isLoading` flag, and any `error`.
 */
export function usePlayers(sessionId: string | undefined) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const q = query(playersRef(sessionId), orderBy("joinedAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updated = snapshot.docs.map((doc) => ({
          ...(doc.data() as Player),
          uid: doc.id,
        }));
        setPlayers(updated);
        setIsLoading(false);
      },
      (err) => {
        setIsError(err);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [sessionId]);

  const currentUser = auth.currentUser;
  const isHost = players.some((p) => p.uid === currentUser?.uid && p.isHost);

  return { isLoading, isError, currentUser, isHost, players };
}
