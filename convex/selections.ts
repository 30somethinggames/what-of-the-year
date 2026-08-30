import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { MAX_ROUNDS } from "./constants";
import { rateLimiter } from "./ratelimits";
import { requireSessionMember } from "./utils/auth";
import { appError } from "./utils/errors";
import { buildPickArg } from "./utils/pick";
import { getRoundByNumber } from "./utils/rounds";

export const getSelections = query({
  args: { sessionId: v.id("sessions"), number: v.number() },
  handler: async (ctx, { sessionId, number }) => {
    if (!(await requireSessionMember(ctx, sessionId))) return [];

    const round = await getRoundByNumber(ctx.db, sessionId, number);
    if (!round) return [];

    return await ctx.db
      .query("selections")
      .withIndex("by_round_uid", (q) => q.eq("roundId", round._id))
      .collect();
  },
});

export const getMySelections = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const identity = await requireSessionMember(ctx, sessionId);
    if (!identity) return [];
    const uid = identity.subject;

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    const results: Doc<"selections">[] = [];

    for (const round of rounds) {
      const sel = await ctx.db
        .query("selections")
        .withIndex("by_round_uid", (q) => q.eq("roundId", round._id).eq("uid", uid))
        .unique();
      if (sel) results.push(sel);
    }

    results.sort((a, b) => a.roundNumber - b.roundNumber);
    return results;
  },
});

const optionArg = v.object({
  id: v.number(),
  name: v.string(),
  cover: v.optional(v.string()),
  rating: v.optional(v.number()),
  first_release_date: v.optional(v.number()),
  summary: v.optional(v.string()),
});

export const saveSelection = mutation({
  args: {
    sessionId: v.id("sessions"),
    roundNumber: v.number(),
    option: optionArg,
  },
  handler: async (ctx, { sessionId, roundNumber, option }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw appError("UNAUTHENTICATED", "Unauthenticated");
    const uid = identity.subject;

    await rateLimiter.limit(ctx, "saveSelection", { key: uid, throws: true });

    const round = await getRoundByNumber(ctx.db, sessionId, roundNumber);
    if (!round) throw appError("NOT_FOUND", "Round not found");
    if (round.state !== "open") throw appError("WRONG_STATE", "Round is not open");

    const existing = await ctx.db
      .query("selections")
      .withIndex("by_round_uid", (q) => q.eq("roundId", round._id).eq("uid", uid))
      .unique();

    if (existing) throw appError("ALREADY_SELECTED", "Selection already exists for this round");

    await ctx.db.insert("selections", {
      sessionId,
      roundId: round._id,
      uid,
      pick: buildPickArg(option),
      points: MAX_ROUNDS + 1 - roundNumber,
      roundNumber,
      savedAt: Date.now(),
    });

    const selectionsComplete = round.selectionsComplete + 1;
    await ctx.db.patch(round._id, { selectionsComplete });

    const session = await ctx.db.get(sessionId);
    if (!session) throw appError("NOT_FOUND", "Session not found");

    const allComplete = selectionsComplete > 0 && selectionsComplete >= session.playerCount;

    if (allComplete) {
      const revealDurationMs = session.playerCount * 4_000 + 5_000;
      const revealEndsAt = Date.now() + revealDurationMs;

      const jobId = await ctx.scheduler.runAfter(revealDurationMs, internal.rounds.completeReveal, {
        sessionId,
        roundNumber,
      });

      await ctx.db.patch(round._id, {
        state: "revealing",
        closedAt: Date.now(),
        revealJobId: jobId,
        revealEndsAt,
      });
    }
  },
});

export const editSelection = mutation({
  args: {
    sessionId: v.id("sessions"),
    roundNumber: v.number(),
    option: optionArg,
  },
  handler: async (ctx, { sessionId, roundNumber, option }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw appError("UNAUTHENTICATED", "Unauthenticated");
    const uid = identity.subject;

    const round = await getRoundByNumber(ctx.db, sessionId, roundNumber);
    if (!round) throw appError("NOT_FOUND", "Round not found");

    const existing = await ctx.db
      .query("selections")
      .withIndex("by_round_uid", (q) => q.eq("roundId", round._id).eq("uid", uid))
      .unique();

    if (!existing) throw appError("NOT_FOUND", "Selection not found");

    await ctx.db.patch(existing._id, {
      pick: buildPickArg(option),
      savedAt: Date.now(),
    });
  },
});

export const getResults = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    if (!(await requireSessionMember(ctx, sessionId))) return [];

    const [allSelections, players] = await Promise.all([
      ctx.db
        .query("selections")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect(),
      ctx.db
        .query("players")
        .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId))
        .collect(),
    ]);

    const playerMap = new Map(players.map((p) => [p.uid, p]));
    const pickMap = new Map<
      string,
      {
        pick: (typeof allSelections)[number]["pick"];
        totalPoints: number;
        votes: { playerName: string; playerAvatar: string; points: number }[];
      }
    >();

    for (const sel of allSelections) {
      const key = sel.pick.id;
      const player = playerMap.get(sel.uid);
      const vote = {
        playerName: player?.name ?? "Unknown",
        playerAvatar: player?.avatar ?? "",
        points: sel.points,
      };

      const existing = pickMap.get(key);
      if (existing) {
        existing.totalPoints += sel.points;
        existing.votes.push(vote);
      } else {
        pickMap.set(key, {
          pick: sel.pick,
          totalPoints: sel.points,
          votes: [vote],
        });
      }
    }

    return Array.from(pickMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  },
});
