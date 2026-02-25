import type { QUERY_ARGS } from "types/query-args";

import { useBooks } from "./use-books";
import { useGames } from "./use-games";
import { useMovies } from "./use-movies";

export function useTopicData(args: QUERY_ARGS) {
  const games = useGames(args);
  const movies = useMovies(args);
  const books = useBooks(args);
  return (games.data && games) || (movies.data && movies) || books;
}
