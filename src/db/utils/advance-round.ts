import { serverTimestamp, writeBatch } from "firebase/firestore";

import { roundRef, sessionRef } from "db/collections";
import { db } from "db/config";

interface AdvanceRoundArgs {
  sessionId: string;
  currentRoundNumber: number;
  maxRounds: number;
}

/**
 * Advances to the next round:
 * - Closes the current round (state = "closed", closedAt = now)
 * - Opens the next round (state = "open", startedAt = now)
 * - Updates session.activeRoundNumber
 *
 * Uses a batch write so all updates succeed or fail atomically.
 * If already at maxRounds, only closes the current round.
 */
export async function advanceRound({ sessionId, currentRoundNumber, maxRounds }: AdvanceRoundArgs) {
  const batch = writeBatch(db);

  // Close current round
  batch.update(roundRef(sessionId, currentRoundNumber), {
    state: "closed",
    closedAt: serverTimestamp(),
  });

  const hasNextRound = currentRoundNumber < maxRounds;

  if (hasNextRound) {
    const nextRoundNumber = currentRoundNumber + 1;

    // Open next round
    batch.update(roundRef(sessionId, nextRoundNumber), {
      state: "open",
      startedAt: serverTimestamp(),
    });

    // Update active round number in session
    batch.update(sessionRef(sessionId), {
      activeRoundNumber: nextRoundNumber,
    });
  }

  await batch.commit();

  return { hasNextRound };
}
