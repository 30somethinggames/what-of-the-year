import type { Timestamp } from "firebase/firestore";

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
