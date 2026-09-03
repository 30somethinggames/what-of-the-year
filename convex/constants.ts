export const MAX_ROUNDS = 10;
export const MAX_PLAYERS = 10;

/** Option topics. Mirrors `TOPIC_KEY` in `src/constants/topics.ts`. */
export const Topic = {
  GAMES: "games",
  MOVIES: "movies",
  BOOKS: "books",
} as const;

export type TopicKey = (typeof Topic)[keyof typeof Topic];

export const SessionStatus = {
  LOBBY: "lobby",
  ACTIVE: "active",
  ENDED: "ended",
} as const;
