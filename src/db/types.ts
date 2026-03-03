import type { Doc, Id } from "convex/_generated/dataModel";

export type Player = Doc<"players">;
export type SessionID = Id<"sessions">;
export type Session = Doc<"sessions">;
export type Round = Doc<"rounds">;
export type Selection = Doc<"selections">;
export type MySelection = Selection & { roundNumber: number };
