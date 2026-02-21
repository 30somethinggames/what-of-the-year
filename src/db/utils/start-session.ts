import { serverTimestamp, writeBatch } from "firebase/firestore";

import { MAX_ROUNDS } from "constants/session";
import { roundRef, sessionRef } from "db/collections";
import { db } from "db/config";

interface StartSessionArgs {
  sessionId: string;
}

/**
 * Starts the game session:
 * - Closes the lobby (isOpen = false)
 * - Sets activeRoundNumber to MAX_ROUNDS (rounds count down from 10 to 1)
 * - Opens round MAX_ROUNDS (state = "open", startedAt = now)
 *
 * Uses a batch write so both updates succeed or fail atomically.
 */
export async function startSession({ sessionId }: StartSessionArgs) {
  const batch = writeBatch(db);

  // Close the lobby and set starting round
  batch.update(sessionRef(sessionId), {
    isOpen: false,
    activeRoundNumber: MAX_ROUNDS,
  });

  // Open the first round to play (highest number = most points)
  batch.update(roundRef(sessionId, MAX_ROUNDS), {
    state: "open",
    startedAt: serverTimestamp(),
  });

  await batch.commit();
}
