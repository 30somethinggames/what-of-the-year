export const MAX_ROUNDS = 10;
export const MAX_PLAYERS = 10;

/** Option topics. Mirrors `TOPIC_KEY` in `src/constants/topics.ts`. */
export const Topic = {
  GAMES: "games",
  MOVIES: "movies",
  BOOKS: "books",
} as const;

export type TopicKey = (typeof Topic)[keyof typeof Topic];

/**
 * Session lifecycle. `COMPLETE` is a game played through to its last round;
 * `FORFEIT` is one the host ended early. Both render results — only `FORFEIT`
 * sends the other players home.
 */
export const SessionStatus = {
  LOBBY: "lobby",
  ACTIVE: "active",
  COMPLETE: "complete",
  FORFEIT: "forfeit",
} as const;
