import { TOPIC_KEY } from "constants/topics";

import type { QUERY_ARGS } from "./types";
import { useBooks } from "./use-books";
import { useGames } from "./use-games";
import { useMovies } from "./use-movies";

export function useTopicData(args: QUERY_ARGS) {
  const games = useGames(args);
  const movies = useMovies(args);
  const books = useBooks(args);

  if (args.key === TOPIC_KEY.GAMES) return games;
  if (args.key === TOPIC_KEY.MOVIES) return movies;
  return books;
}
