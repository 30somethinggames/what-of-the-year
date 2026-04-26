import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireSessionMember } from "./utils/auth";
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const currentRound = await ctx.db
      .query("rounds")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("number"), currentRoundNumber))
      .unique();

    if (!currentRound) throw new Error("Round not found");

    if (currentRound.state === "revealing") {
      if (currentRound.revealJobId) {
        await ctx.scheduler.cancel(currentRound.revealJobId);
      }

      return await completeRevealLogic(ctx, sessionId, currentRoundNumber, currentRound._id);
    }

    const hasSelections = await ctx.db
      .query("selections")
      .withIndex("by_round_uid", (q) => q.eq("roundId", currentRound._id))
      .first();

    if (!hasSelections) {
      await ctx.db.patch(currentRound._id, { closedAt: Date.now() });
      return await completeRevealLogic(ctx, sessionId, currentRoundNumber, currentRound._id);
    }

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");

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

    return { hasNextRound: true };
  },
});

export const completeReveal = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    roundNumber: v.number(),
  },
  handler: async (ctx, { sessionId, roundNumber }) => {
    const round = await getRoundByNumber(ctx.db, sessionId, roundNumber);
    if (!round) throw new Error("Round not found");
    if (round.state !== "revealing") return;

    return await completeRevealLogic(ctx, sessionId, roundNumber, round._id);
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

  const hasNextRound = roundNumber > 1;

  if (hasNextRound) {
    const nextRoundNumber = roundNumber - 1;

    const nextRound = await getRoundByNumber(ctx.db, sessionId, nextRoundNumber);
    if (!nextRound) throw new Error("Next round not found");

    await ctx.db.patch(nextRound._id, {
      state: "open",
      startedAt: Date.now(),
    });

    await ctx.db.patch(sessionId, {
      activeRoundNumber: nextRoundNumber,
    });
  }

  return { hasNextRound };
}
