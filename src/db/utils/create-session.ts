import { Timestamp, doc, serverTimestamp, writeBatch } from "firebase/firestore";

import { SESSION_TTL_MS, buildAllRounds, buildPlayer, buildSession } from "db/builders";
import { playerRef, roundRef, sessionsRef } from "db/collections";
import { db } from "db/config";

interface CreateSessionArgs {
  topic: string;
  year: number;
  uid: string;
  name: string;
  avatar: string;
}

/**
 * Creates a full session tree in Firestore:
 * - session document
 * - host player document
 * - all round documents (pending state)
 *
 * Uses a batch write so everything succeeds or fails atomically.
 * Returns the new session ID.
 */
export async function createSession({ topic, year, uid, name, avatar }: CreateSessionArgs) {
  const newSessionRef = doc(sessionsRef());
  const sessionId = newSessionRef.id;

  // Batch 1: session + host player (must exist before rounds for security rules)
  const sessionBatch = writeBatch(db);

  sessionBatch.set(newSessionRef, {
    ...buildSession(topic, year),
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + SESSION_TTL_MS),
  });

  sessionBatch.set(playerRef(sessionId, uid), {
    ...buildPlayer(name, avatar, true),
    joinedAt: serverTimestamp(),
  });

  await sessionBatch.commit();

  // Batch 2: rounds (isHost check requires player doc to exist)
  const roundsBatch = writeBatch(db);
  const rounds = buildAllRounds();
  for (const round of rounds) {
    roundsBatch.set(roundRef(sessionId, round.number), round);
  }

  await roundsBatch.commit();

  return { sessionId };
}
