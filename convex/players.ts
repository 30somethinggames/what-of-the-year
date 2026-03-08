import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { SessionStatus } from "./constants";
import { getRoundByNumber } from "./utils/rounds";

export const joinSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.string(),
    avatar: v.string(),
  },
  handler: async (ctx, { sessionId, name, avatar }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const uid = identity.subject;

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== SessionStatus.LOBBY) throw new Error("Session is closed");
    if (session.playerCount >= session.maxPlayers) throw new Error("Session is full");

    // Check if already joined
    const existing = await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", uid))
      .unique();
    if (existing) throw new Error("Already joined this session");

    await ctx.db.insert("players", {
      sessionId,
      uid,
      name,
      avatar,
      isHost: false,
    });

    await ctx.db.patch(sessionId, {
      playerCount: session.playerCount + 1,
    });
  },
});

export const leaveSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const uid = identity.subject;

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");

    const player = await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", uid))
      .unique();

    if (!player) throw new Error("Player not in session");
    if (player.isHost) throw new Error("Host cannot leave session");

    await ctx.db.delete(player._id);
    await ctx.db.patch(sessionId, {
      playerCount: session.playerCount - 1,
    });
  },
});

export const kickFromLobby = mutation({
  args: {
    sessionId: v.id("sessions"),
    uid: v.string(),
  },
  handler: async (ctx, { sessionId, uid }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const host = await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", identity.subject))
      .unique();
    if (!host?.isHost) throw new Error("Only the host can kick players");

    const player = await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", uid))
      .unique();
    if (!player) throw new Error("Player not found");
    if (player.isHost) throw new Error("Cannot kick the host");

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== SessionStatus.LOBBY)
      throw new Error("Cannot kick from lobby after game has started");

    await ctx.db.delete(player._id);
    await ctx.db.patch(sessionId, {
      playerCount: session.playerCount - 1,
    });
  },
});

export const kickFromGame = mutation({
  args: {
    sessionId: v.id("sessions"),
    uid: v.string(),
  },
  handler: async (ctx, { sessionId, uid }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const host = await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", identity.subject))
      .unique();
    if (!host?.isHost) throw new Error("Only the host can kick players");

    const player = await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", uid))
      .unique();
    if (!player) throw new Error("Player not found");
    if (player.isHost) throw new Error("Cannot kick the host");

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");

    // Delete all selections by the kicked player
    const selections = await ctx.db
      .query("selections")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("uid"), uid))
      .collect();

    for (const sel of selections) {
      await ctx.db.delete(sel._id);
    }

    // Delete the player
    await ctx.db.delete(player._id);
    const newPlayerCount = session.playerCount - 1;
    await ctx.db.patch(sessionId, { playerCount: newPlayerCount });

    // Recheck the current open round — may need to close if remaining players are done
    const activeRound = await getRoundByNumber(ctx.db, sessionId, session.activeRoundNumber);
    if (activeRound && activeRound.state === "open") {
      // Recalculate selectionsComplete: count remaining selections for this round
      const roundSelections = await ctx.db
        .query("selections")
        .withIndex("by_round_uid", (q) => q.eq("roundId", activeRound._id))
        .collect();

      const newSelectionsComplete = roundSelections.length;
      await ctx.db.patch(activeRound._id, { selectionsComplete: newSelectionsComplete });

      if (newSelectionsComplete > 0 && newSelectionsComplete >= newPlayerCount) {
        await ctx.db.patch(activeRound._id, { state: "closed", closedAt: Date.now() });

        if (activeRound.number > 1) {
          const nextRound = await getRoundByNumber(ctx.db, sessionId, activeRound.number - 1);
          if (nextRound) {
            await ctx.db.patch(nextRound._id, { state: "open", startedAt: Date.now() });
            await ctx.db.patch(sessionId, { activeRoundNumber: activeRound.number - 1 });
          }
        }
      }
    }
  },
});

export const getPlayers = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

export const getMyPlayer = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", identity.subject))
      .unique();
  },
});
