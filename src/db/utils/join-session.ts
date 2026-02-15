import { increment, runTransaction, serverTimestamp } from "firebase/firestore";

import { buildPlayer } from "db/builders";
import { playerRef, sessionRef } from "db/collections";
import { db } from "db/config";

interface JoinSessionArgs {
  sessionId: string;
  uid: string;
  name: string;
  avatar: string;
}

/**
 * Adds a player to an existing session.
 *
 * Uses a transaction to:
 * 1. Verify the session exists and is open
 * 2. Check player count hasn't exceeded maxPlayers
 * 3. Write the player doc
 * 4. Increment playerCount on the session
 */
export async function joinSession({ sessionId, uid, name, avatar }: JoinSessionArgs) {
  const sessionDocRef = sessionRef(sessionId);
  const playerDocRef = playerRef(sessionId, uid);

  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionDocRef);

    if (!sessionSnap.exists()) {
      throw new Error("Session not found");
    }

    const session = sessionSnap.data();

    if (!session.isOpen) {
      throw new Error("Session is closed");
    }

    if (session.playerCount >= session.maxPlayers) {
      throw new Error("Session is full");
    }

    // Check if player already joined
    const playerSnap = await transaction.get(playerDocRef);
    if (playerSnap.exists()) {
      throw new Error("Already joined this session");
    }

    transaction.set(playerDocRef, {
      ...buildPlayer(name, avatar, false),
      joinedAt: serverTimestamp(),
    });

    transaction.update(sessionDocRef, {
      playerCount: increment(1),
    });
  });

  return { sessionId };
}
