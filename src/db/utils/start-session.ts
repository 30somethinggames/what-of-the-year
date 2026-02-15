import { serverTimestamp, writeBatch } from "firebase/firestore";

import { roundRef, sessionRef } from "db/collections";
import { db } from "db/config";

interface StartSessionArgs {
  sessionId: string;
}

/**
 * Starts the game session:
 * - Closes the lobby (isOpen = false)
 * - Opens round 1 (state = "open", startedAt = now)
 *
 * Uses a batch write so both updates succeed or fail atomically.
 */
export async function startSession({ sessionId }: StartSessionArgs) {
  const batch = writeBatch(db);

  // Close the lobby
  batch.update(sessionRef(sessionId), {
    isOpen: false,
  });

  // Open round 1
  batch.update(roundRef(sessionId, 1), {
    state: "open",
    startedAt: serverTimestamp(),
  });

  await batch.commit();
}
