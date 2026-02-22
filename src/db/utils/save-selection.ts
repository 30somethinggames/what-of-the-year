import { increment, runTransaction, serverTimestamp } from "firebase/firestore";

import { buildPick, buildPickFromOption, getRoundWeight } from "db/builders";
import { roundRef, selectionRef } from "db/collections";
import { db } from "db/config";
import type { Option } from "types/option";

interface SaveSelectionArgs {
  sessionId: string;
  roundNumber: number;
  uid: string;
  name: string;
  option?: Option;
}

/**
 * Saves a player's selection for a round.
 *
 * Uses a transaction to:
 * 1. Check the player hasn't already submitted for this round
 * 2. Write the selection doc
 * 3. Increment `selectionsComplete` on the round doc
 *
 * Points are computed deterministically from the round weight.
 */
export async function saveSelection({
  sessionId,
  roundNumber,
  uid,
  name,
  option,
}: SaveSelectionArgs) {
  const selRef = selectionRef(sessionId, roundNumber, uid);
  const rndRef = roundRef(sessionId, roundNumber);

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(selRef);
    if (existing.exists()) {
      throw new Error("Selection already exists for this round");
    }

    transaction.set(selRef, {
      pick: option ? buildPickFromOption(option) : buildPick(name),
      points: getRoundWeight(roundNumber),
      savedAt: serverTimestamp(),
    });

    transaction.update(rndRef, {
      selectionsComplete: increment(1),
    });
  });
}
