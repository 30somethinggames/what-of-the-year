import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { SessionID } from "db/types";

/**
 * Subscribes to the players list and current user's player doc for a session in real time.
 *
 * Automatically skips subscribing if `sessionId` is undefined. `getPlayers` is
 * member-only and throws for everyone else, so the roster subscription waits for
 * `getMyPlayer` to confirm membership — an invitee holding the session link sits
 * on the join screen instead of the error boundary.
 *
 * @param sessionId - The session to listen to. Pass `undefined` to skip subscribing.
 * @returns An object containing the `players` array, `currentUser` player doc, `isHost` flag, and an `isLoading` flag.
 */
export function usePlayers(sessionId: SessionID | undefined) {
  const currentUser = useQuery(api.players.getMyPlayer, sessionId ? { sessionId } : "skip");
  const isMember = Boolean(currentUser);
  const players = useQuery(api.players.getPlayers, sessionId && isMember ? { sessionId } : "skip");

  return {
    isLoading: currentUser === undefined || (isMember && players === undefined),
    players: players ?? [],
    currentUser,
    isHost: currentUser?.isHost ?? false,
  };
}

/** Adds the caller to a session as a player. */
export function useJoinSession() {
  return useMutation(api.players.joinSession);
}

/** Removes the caller from a lobby. */
export function useLeaveSession() {
  return useMutation(api.players.leaveSession);
}

/** Host-only: removes another player from a lobby. */
export function useKickFromLobby() {
  return useMutation(api.players.kickFromLobby);
}

/** Host-only: removes another player from a game in progress. */
export function useKickFromGame() {
  return useMutation(api.players.kickFromGame);
}
