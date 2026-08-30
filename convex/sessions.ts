import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { MAX_PLAYERS, MAX_ROUNDS, SessionStatus } from "./constants";
import { rateLimiter } from "./ratelimits";
import { apiError } from "./utils/errors";
import { validateAvatar, validateName } from "./utils/validate";

export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw apiError("UNAUTHENTICATED", "Unauthenticated");

    return await ctx.db.get(sessionId);
  },
});

export const createSession = mutation({
  args: {
    topic: v.string(),
    year: v.number(),
    name: v.string(),
    avatar: v.string(),
  },
  handler: async (ctx, { topic, year, name, avatar }) => {
    const nameError = validateName(name);
    if (nameError) throw apiError("VALIDATION", nameError);
    const avatarError = validateAvatar(avatar);
    if (avatarError) throw apiError("VALIDATION", avatarError);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw apiError("UNAUTHENTICATED", "Unauthenticated");
    const uid = identity.subject;

    await rateLimiter.limit(ctx, "createSession", { key: uid, throws: true });

    const sessionId = await ctx.db.insert("sessions", {
      topic,
      year,
      maxRounds: MAX_ROUNDS,
      maxPlayers: MAX_PLAYERS,
      playerCount: 1,
      activeRoundNumber: 1,
      status: SessionStatus.LOBBY,
    });

    await ctx.db.insert("players", {
      sessionId,
      uid,
      name,
      avatar,
      isHost: true,
    });

    const rounds = Array.from({ length: MAX_ROUNDS }, (_, i) => ({
      number: i + 1,
      state: "pending" as const,
      weight: MAX_ROUNDS + 1 - (i + 1),
      selectionsComplete: 0,
      startedAt: null,
      closedAt: null,
    }));

    for (const round of rounds) {
      await ctx.db.insert("rounds", {
        sessionId,
        ...round,
      });
    }

    return { sessionId };
  },
});

export const endSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw apiError("UNAUTHENTICATED", "Unauthenticated");

    const host = await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", identity.subject))
      .unique();

    if (!host?.isHost) throw apiError("NOT_HOST", "Only the host can end the session");

    const session = await ctx.db.get(sessionId);
    if (!session) throw apiError("NOT_FOUND", "Session not found");

    await ctx.db.patch(sessionId, { status: SessionStatus.ENDED });
  },
});

export const startSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw apiError("UNAUTHENTICATED", "Unauthenticated");

    const session = await ctx.db.get(sessionId);
    if (!session) throw apiError("NOT_FOUND", "Session not found");

    const host = await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", identity.subject))
      .unique();

    if (!host?.isHost) throw apiError("NOT_HOST", "Only the host can start the session");

    const round = await ctx.db
      .query("rounds")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("number"), MAX_ROUNDS))
      .unique();

    if (!round) throw apiError("NOT_FOUND", "Round not found");

    await ctx.db.patch(sessionId, {
      activeRoundNumber: MAX_ROUNDS,
      status: SessionStatus.ACTIVE,
    });

    await ctx.db.patch(round._id, {
      state: "open",
      startedAt: Date.now(),
    });
  },
});
