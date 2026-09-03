import type { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";

export type Player = Doc<"players">;
export type SessionID = Id<"sessions">;
export type Session = Doc<"sessions">;
export type Round = Doc<"rounds">;
/** A round selection as the server hands it out — `pick` is null pre-reveal. */
export type Selection = FunctionReturnType<typeof api.selections.getSelections>[number];
export type MySelection = Doc<"selections"> & { roundNumber: number };
export type RankedPick = FunctionReturnType<typeof api.selections.getResults>[number];
