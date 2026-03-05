import { useLocalSearchParams } from "expo-router";

import type { TOPIC_KEY } from "constants/topics";
import { getTopic } from "constants/topics";
import type { SessionID } from "db/types";

export type Params = {
  /** The topic key (e.g., 'movies', 'games', 'books') */
  topic?: TOPIC_KEY;
  /** The year for the session (e.g., '2025') */
  year?: string;
  /** The unique session ID */
  sessionId?: string;
  /** The current round number */
  round?: string;
};

/**
 * Wraps `useLocalSearchParams` and converts the raw topic param
 * into a validated Topic object via `getTopic()`.
 */
export function useParams() {
  const { topic, year, sessionId, round } = useLocalSearchParams<Params>();
  return {
    sessionId: sessionId as SessionID,
    year,
    topic: getTopic(topic),
    round: Number(round),
  };
}
