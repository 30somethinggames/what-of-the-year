import { MAX_PLAYERS, MAX_ROUNDS } from "constants/session";

/** Session TTL in milliseconds (24 hours) */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** Deterministic round weights: round 1 = 1pt, round 10 = 10pts */
export const getRoundWeight = (roundNumber: number) => roundNumber;

/** Build the session document data */
export const buildSession = (topic: string, year: number) => ({
  topic,
  year,
  maxRounds: MAX_ROUNDS,
  maxPlayers: MAX_PLAYERS,
  isOpen: true,
  playerCount: 1,
  activeRoundNumber: 1,
});

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
