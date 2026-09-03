import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { MAX_ROUNDS } from "./constants";
import { rateLimiter } from "./ratelimits";
import { requireSessionMember } from "./utils/auth";
import { apiError } from "./utils/errors";
import { buildPickArg } from "./utils/pick";
import { getRoundByNumber, isRoundRevealed } from "./utils/rounds";

export const getSelections = query({
  args: { sessionId: v.id("sessions"), number: v.number() },
  handler: async (ctx, { sessionId, number }) => {
    await requireSessionMember(ctx, sessionId);

    const round = await getRoundByNumber(ctx.db, sessionId, number);
    if (!round) return [];

    const selections = await ctx.db
      .query("selections")
      .withIndex("by_round_uid", (q) => q.eq("roundId", round._id))
      .collect();

    // Clients subscribe to this live while the round is open, so a pick sent
    // pre-reveal sits in every opponent's memory. Until the round reveals, send
    // only the uids the who-has-picked indicator needs.
    const revealed = isRoundRevealed(round);

    return selections.map((sel) => ({
      _id: sel._id,
      uid: sel.uid,
      pick: revealed ? sel.pick : null,
    }));
  },
});

export const getMySelections = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const identity = await requireSessionMember(ctx, sessionId);
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
    const identity = await requireSessionMember(ctx, sessionId);
    const uid = identity.subject;

    await rateLimiter.limit(ctx, "saveSelection", { key: uid, throws: true });

    const round = await getRoundByNumber(ctx.db, sessionId, roundNumber);
    if (!round) throw apiError("NOT_FOUND", "Round not found");
    if (round.state !== "open") throw apiError("WRONG_STATE", "Round is not open");

    const existing = await ctx.db
      .query("selections")
      .withIndex("by_round_uid", (q) => q.eq("roundId", round._id).eq("uid", uid))
      .unique();

    if (existing) throw apiError("ALREADY_SELECTED", "Selection already exists for this round");

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
    if (!session) throw apiError("NOT_FOUND", "Session not found");

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
    const identity = await requireSessionMember(ctx, sessionId);
    const uid = identity.subject;

    await rateLimiter.limit(ctx, "editSelection", { key: uid, throws: true });

    const round = await getRoundByNumber(ctx.db, sessionId, roundNumber);
    if (!round) throw apiError("NOT_FOUND", "Round not found");
    if (round.state !== "open") throw apiError("WRONG_STATE", "Round is not open");

    const existing = await ctx.db
      .query("selections")
      .withIndex("by_round_uid", (q) => q.eq("roundId", round._id).eq("uid", uid))
      .unique();

    if (!existing) throw apiError("NOT_FOUND", "Selection not found");

    await ctx.db.patch(existing._id, {
      pick: buildPickArg(option),
      savedAt: Date.now(),
    });
  },
});

export const getResults = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await requireSessionMember(ctx, sessionId);

    const [allSelections, players, rounds] = await Promise.all([
      ctx.db
        .query("selections")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect(),
      ctx.db
        .query("players")
        .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId))
        .collect(),
      ctx.db
        .query("rounds")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect(),
    ]);

    // Any member can run this mid-game, so a still-secret round must not be
    // tallied here either.
    const revealedRoundIds = new Set(rounds.filter(isRoundRevealed).map((r) => r._id));

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
      if (!revealedRoundIds.has(sel.roundId)) continue;

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
