import type { Timestamp } from "firebase/firestore";

import type { TOPIC_KEY } from "constants/topics";

// --- sessions/{sessionId} ---
export interface Session {
  _id: string;
  _creationTime: number;
  topic: string;
  year: number;
  maxRounds: number;
  maxPlayers: number;
  isOpen: boolean;
  playerCount: number;
  activeRoundNumber: number;
}

// --- sessions/{sessionId}/players/{uid} ---
export interface Player {
  uid: string;
  name: string;
  avatar: string;
  joinedAt: Timestamp;
  isHost: boolean;
}

// --- sessions/{sessionId}/rounds/{roundNumber} ---
export type RoundState = "pending" | "open" | "closed";

export interface Round {
  number: number;
  state: RoundState;
  weight: number;
  selectionsComplete: number;
  startedAt: Timestamp | null;
  closedAt: Timestamp | null;
}

// --- sessions/{sessionId}/rounds/{roundNumber}/selections/{uid} ---
export interface Pick {
  id: string;
  name: string;
  cover?: string;
  rating?: number;
  first_release_date?: number;
  summary?: string;
}

export interface Selection {
  pick: Pick;
  points: number;
  savedAt: Timestamp;
}
