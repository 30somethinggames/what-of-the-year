import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

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
    if (!session.isOpen) throw new Error("Session is closed");
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

export const getPlayers = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});
