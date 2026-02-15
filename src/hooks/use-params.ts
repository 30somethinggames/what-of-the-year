import { useLocalSearchParams } from "expo-router";

import type { TOPIC_KEY } from "constants/topics";
import { getTopic } from "constants/topics";

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
 * Custom hook that extracts and validates route parameters from the current URL.
 *
 * This hook wraps expo-router's `useLocalSearchParams` and provides additional
 * validation by converting the raw topic parameter into a validated Topic object
 * using `getTopic()`.
 *
 * @returns An object containing the validated topic object and other route parameters
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const { topic, year, session, round } = useParams();
 *   // topic is a validated Topic object with name, icon, etc.
 *   // year, session, and round are strings (if present in URL)
 * }
 * ```
 */
export function useParams() {
  const params = useLocalSearchParams<Params>();
  const { topic: paramsTopic, ...rest } = params;
  const topic = getTopic(paramsTopic);
  return {
    ...rest,
    topic,
  };
}
