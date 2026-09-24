import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Backend } from "types/backend";

import { toSessionId } from "./ids";

/**
 * `getPlayers` is member-only and throws for everyone else, so the roster
 * subscription waits for `getMyPlayer` to confirm membership — an invitee
 * holding the session link sits on the join screen instead of the error
 * boundary.
 */
export const usePlayers: Backend["usePlayers"] = (sessionId) => {
  const args = sessionId ? { sessionId: toSessionId(sessionId) } : "skip";
  const currentUser = useQuery(api.players.getMyPlayer, args);
  const isMember = Boolean(currentUser);
  const players = useQuery(api.players.getPlayers, isMember ? args : "skip");

  return {
    isLoading: currentUser === undefined || (isMember && players === undefined),
    players: players ?? [],
    currentUser,
    isHost: currentUser?.isHost ?? false,
  };
};

/** Adds the caller to a session as a player. */
export const useJoinSession: Backend["useJoinSession"] = () => {
  const join = useMutation(api.players.joinSession);
  return ({ sessionId, ...rest }) => join({ sessionId: toSessionId(sessionId), ...rest });
};

/** Removes the caller from a session in any state, unless they are the host. */
export const useLeaveSession: Backend["useLeaveSession"] = () => {
  const leave = useMutation(api.players.leaveSession);
  return ({ sessionId }) => leave({ sessionId: toSessionId(sessionId) });
};

/** Host-only: removes another player from a lobby. */
export const useKickFromLobby: Backend["useKickFromLobby"] = () => {
  const kick = useMutation(api.players.kickFromLobby);
  return ({ sessionId, uid }) => kick({ sessionId: toSessionId(sessionId), uid });
};

/** Host-only: removes another player from a game in progress. */
export const useKickFromGame: Backend["useKickFromGame"] = () => {
  const kick = useMutation(api.players.kickFromGame);
  return ({ sessionId, uid }) => kick({ sessionId: toSessionId(sessionId), uid });
};
