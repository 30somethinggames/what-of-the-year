import { serverTimestamp, updateDoc } from "firebase/firestore";

import { buildPick, buildPickFromOption } from "db/builders";
import { selectionRef } from "db/collections";
import type { Option } from "types/option";

interface EditSelectionArgs {
  sessionId: string;
  roundNumber: number;
  uid: string;
  name: string;
  option?: Option;
}

/**
 * Edits an existing selection for a round.
 *
 * Only updates the `pick` and `savedAt` fields on the existing doc.
 * Does NOT touch `selectionsComplete` since the player already submitted.
 */
export async function editSelection({
  sessionId,
  roundNumber,
  uid,
  name,
  option,
}: EditSelectionArgs) {
  const ref = selectionRef(sessionId, roundNumber, uid);

  await updateDoc(ref, {
    pick: option ? buildPickFromOption(option) : buildPick(name),
    savedAt: serverTimestamp(),
  });
}
