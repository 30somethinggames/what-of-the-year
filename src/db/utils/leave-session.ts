import { increment, runTransaction } from "firebase/firestore";

import { playerRef, sessionRef } from "db/collections";
import { db } from "db/config";

interface LeaveSessionArgs {
  sessionId: string;
  /** user uid */
  uid?: string;
}
/**
 * Removes a non-host player from a session.
 *
 * Uses a transaction to:
 * 1. Verify the session and player exist
 * 2. Prevent the host from leaving (host should end the session instead)
 * 3. Delete the player doc
 * 4. Decrement playerCount on the session
 */
export async function leaveSession({ sessionId, uid }: LeaveSessionArgs) {
  if (!uid) throw new Error("No Player UID");

  const sessionDocRef = sessionRef(sessionId);
  const playerDocRef = playerRef(sessionId, uid);

  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionDocRef);
    const playerSnap = await transaction.get(playerDocRef);

    if (!sessionSnap.exists()) throw new Error("Session not found");
    if (!playerSnap.exists()) throw new Error("Player not in session");

    const player = playerSnap.data();
    if (player.isHost) throw new Error("Host cannot leave session");

    transaction.delete(playerDocRef);
    transaction.update(sessionDocRef, {
      playerCount: increment(-1),
    });
  });
}
