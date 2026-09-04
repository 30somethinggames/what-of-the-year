export enum TOPIC_KEY {
  GAMES = "games",
  MOVIES = "movies",
  BOOKS = "books",
}

export type TopicType = {
  value: TOPIC_KEY;
  label: string;
};

export const topics: TopicType[] = [
  { value: TOPIC_KEY.GAMES, label: "Game" },
  { value: TOPIC_KEY.MOVIES, label: "Movie" },
  { value: TOPIC_KEY.BOOKS, label: "Book" },
];

export const getTopic = (topic?: TOPIC_KEY) => topics.find((t) => t.value === topic);

/**
 * Route-level lookup for the `:topic` URL segment. Throws so an unknown topic
 * reaches the root ErrorBoundary — a dead URL is an error screen, not a blank one.
 */
export const requireTopic = (topic?: TOPIC_KEY) => {
  const found = getTopic(topic);
  if (!found) throw new Error("Unknown topic");
  return found;
};
