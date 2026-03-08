import type { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";

export type Player = Doc<"players">;
export type SessionID = Id<"sessions">;
export type Session = Doc<"sessions">;
export type Round = Doc<"rounds">;
export type Selection = Doc<"selections">;
export type MySelection = Selection & { roundNumber: number };
export type RankedPick = FunctionReturnType<typeof api.selections.getResults>[number];
