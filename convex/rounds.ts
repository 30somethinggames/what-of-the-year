import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { SessionStatus } from "./constants";
import { rateLimiter } from "./ratelimits";
import { requireSessionMember } from "./utils/auth";
import { apiError } from "./utils/errors";
import { getRoundByNumber } from "./utils/rounds";

export const getRound = query({
  args: { sessionId: v.id("sessions"), number: v.number() },
  handler: async (ctx, { sessionId, number }) => {
    await requireSessionMember(ctx, sessionId);

    const round = await ctx.db
      .query("rounds")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("number"), number))
      .unique();

    return round ?? null;
  },
});

export const advanceRound = mutation({
  args: {
    sessionId: v.id("sessions"),
    currentRoundNumber: v.number(),
  },
  handler: async (ctx, { sessionId, currentRoundNumber }) => {
    const identity = await requireSessionMember(ctx, sessionId);
    const uid = identity.subject;

    const host = await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", uid))
      .unique();

    if (!host?.isHost) throw apiError("NOT_HOST", "Only the host can advance the round");

    await rateLimiter.limit(ctx, "advanceRound", { key: uid, throws: true });

    const session = await ctx.db.get(sessionId);
    if (!session) throw apiError("NOT_FOUND", "Session not found");
    if (session.status !== SessionStatus.ACTIVE) {
      throw apiError("WRONG_STATE", "Session is not in play");
    }

    const currentRound = await ctx.db
      .query("rounds")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("number"), currentRoundNumber))
      .unique();

    if (!currentRound) throw apiError("NOT_FOUND", "Round not found");
    if (currentRound.state !== "open" && currentRound.state !== "revealing") {
      throw apiError("WRONG_STATE", "Round is not in play");
    }

    if (currentRound.state === "revealing") {
      if (currentRound.revealJobId) {
        await ctx.scheduler.cancel(currentRound.revealJobId);
      }

      await completeRevealLogic(ctx, sessionId, currentRoundNumber, currentRound._id);
      return;
    }

    const hasSelections = await ctx.db
      .query("selections")
      .withIndex("by_round_uid", (q) => q.eq("roundId", currentRound._id))
      .first();

    if (!hasSelections) {
      await ctx.db.patch(currentRound._id, { closedAt: Date.now() });
      await completeRevealLogic(ctx, sessionId, currentRoundNumber, currentRound._id);
      return;
    }

    const revealDurationMs = session.playerCount * 4_000 + 5_000;
    const revealEndsAt = Date.now() + revealDurationMs;

    const jobId = await ctx.scheduler.runAfter(revealDurationMs, internal.rounds.completeReveal, {
      sessionId,
      roundNumber: currentRoundNumber,
    });

    await ctx.db.patch(currentRound._id, {
      state: "revealing",
      closedAt: Date.now(),
      revealJobId: jobId,
      revealEndsAt,
    });
  },
});

export const completeReveal = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    roundNumber: v.number(),
  },
  handler: async (ctx, { sessionId, roundNumber }) => {
    // Internal: no auth or rate limit — only the scheduler reaches this, running
    // jobs queued by `advanceRound` and `saveSelection`.
    const session = await ctx.db.get(sessionId);
    if (!session) throw apiError("NOT_FOUND", "Session not found");
    if (session.status === SessionStatus.FORFEIT) return;

    const round = await getRoundByNumber(ctx.db, sessionId, roundNumber);
    if (!round) throw apiError("NOT_FOUND", "Round not found");
    if (round.state !== "revealing") return;

    await completeRevealLogic(ctx, sessionId, roundNumber, round._id);
  },
});

async function completeRevealLogic(
  ctx: { db: MutationCtx["db"] },
  sessionId: Id<"sessions">,
  roundNumber: number,
  roundId: Id<"rounds">,
) {
  await ctx.db.patch(roundId, {
    state: "closed",
    revealJobId: undefined,
    revealEndsAt: undefined,
  });

  // Round 1 is the last one played: closing it completes the game, and the
  // session status alone tells every client to show results.
  if (roundNumber === 1) {
    await ctx.db.patch(sessionId, { status: SessionStatus.COMPLETE });
    return;
  }

  const nextRoundNumber = roundNumber - 1;

  const nextRound = await getRoundByNumber(ctx.db, sessionId, nextRoundNumber);
  if (!nextRound) throw apiError("NOT_FOUND", "Next round not found");

  await ctx.db.patch(nextRound._id, {
    state: "open",
    startedAt: Date.now(),
  });

  await ctx.db.patch(sessionId, {
    activeRoundNumber: nextRoundNumber,
  });
}
