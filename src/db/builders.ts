import { MAX_ROUNDS } from "convex/constants";

import type { Option } from "types/option";
import type { Pick } from "types/session";

/** Session TTL in milliseconds (24 hours) */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** Deterministic round weights: round 10 = 1pt, round 1 = 10pts (lower pick = higher value) */
export const getRoundWeight = (roundNumber: number) => MAX_ROUNDS + 1 - roundNumber;

/** Build the host player document data */
export const buildPlayer = (name: string, avatar: string, isHost: boolean) => ({
  name,
  avatar,
  isHost,
});

/** Build a round document data */
export const buildRound = (roundNumber: number) => ({
  number: roundNumber,
  state: "pending" as const,
  weight: getRoundWeight(roundNumber),
  selectionsComplete: 0,
  startedAt: null,
  closedAt: null,
});

/** Build all round documents for a session */
export const buildAllRounds = (maxRounds: number = MAX_ROUNDS) =>
  Array.from({ length: maxRounds }, (_, i) => buildRound(i + 1));

/** Build a pick object from a name (generates a simple ID) */
export const buildPick = (name: string): Pick => ({
  id: name.toLowerCase().replace(/\s+/g, "-"),
  name,
});

/** Build a pick object from a full Option (preserves all metadata) */
export const buildPickFromOption = (option: Option): Pick => ({
  id: String(option.id),
  name: option.name,
  cover: normalizeCover(option.cover),
  rating: option.rating,
  first_release_date: option.first_release_date,
  summary: option.summary,
});

/** Normalize cover URL coming from IGDB which can be protocol-relative (e.g. `//images...`) */
function normalizeCover(url?: string) {
  if (!url) return undefined;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}
