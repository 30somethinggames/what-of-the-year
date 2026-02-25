import { useQuery } from "@tanstack/react-query";

import { TOPIC_KEY } from "constants/topics";
import type { Option } from "types/option";
import type { QUERY_ARGS } from "types/query-args";
import { currentYear } from "utils/dates";

import { handleError, getStaleTime } from "./utils";

const IGDB_API_URL = process.env.EXPO_PUBLIC_IGDB_API_URL;
const CLIENT_ID = process.env.EXPO_PUBLIC_IGDB_CLIENT_ID!;
const ACCESS_TOKEN = process.env.EXPO_PUBLIC_IGDB_ACCESS_TOKEN;

interface Game {
  id: number;
  name: string;
  cover?: {
    id: number;
    url: string;
  };
  /** Average IGDB user rating (0-100) */
  rating?: number;
  /** Rating based on external critic scores (0-100) */
  aggregated_rating?: number;
  /** Average rating based on both IGDB user and external critic scores (0-100) */
  total_rating?: number;
  /** Number of total rating votes */
  total_rating_count?: number;
  first_release_date: number;
  summary?: string;
}

async function getGamesForYear(year: string): Promise<Game[]> {
  const { startDate, endDate } = currentYear(year);

  const response = await fetch(`${IGDB_API_URL}/games`, {
    method: "POST",
    headers: {
      "Client-ID": CLIENT_ID,
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "text/plain",
    },
    body: `
      fields name, cover.url, rating, aggregated_rating, total_rating, total_rating_count, first_release_date, summary;
      where first_release_date >= ${startDate} & first_release_date < ${endDate}
        & total_rating != null;
      sort total_rating desc;
      limit 500;
    `,
  });

  if (!response.ok) {
    await handleError("IGDB", response);
  }

  const data = await response.json();

  return data;
}

export function formGameOptions(games: Game[]): Option[] {
  return games.map((game) => ({
    id: game.id,
    name: game.name,
    cover: game.cover?.url,
    rating: game.total_rating ?? 0,
    first_release_date: game.first_release_date,
    summary: game.summary,
  }));
}

const GAMES_QUERY_KEY = TOPIC_KEY.GAMES;

export function useGames({ key, year }: QUERY_ARGS) {
  const enabled = key === GAMES_QUERY_KEY;
  return useQuery({
    queryKey: [GAMES_QUERY_KEY, year],
    queryFn: () => getGamesForYear(year),
    select: formGameOptions,
    staleTime: getStaleTime(year),
    enabled,
  });
}
