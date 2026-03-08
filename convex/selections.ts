import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { MAX_ROUNDS } from "./constants";
import { buildPickArg } from "./utils/pick";
import { getRoundByNumber } from "./utils/rounds";

export const getSelections = query({
  args: { sessionId: v.id("sessions"), number: v.number() },
  handler: async (ctx, { sessionId, number }) => {
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
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

export const getAllSelections = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("selections")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
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
    if (!identity) throw new Error("Unauthenticated");
    const uid = identity.subject;

    const round = await getRoundByNumber(ctx.db, sessionId, roundNumber);
    if (!round) throw new Error("Round not found");

    const existing = await ctx.db
      .query("selections")
      .withIndex("by_round_uid", (q) => q.eq("roundId", round._id).eq("uid", uid))
      .unique();

    if (existing) throw new Error("Selection already exists for this round");

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
    if (!session) throw new Error("Session not found");

    const allComplete = selectionsComplete > 0 && selectionsComplete >= session.playerCount;

    if (allComplete) {
      await ctx.db.patch(round._id, { state: "closed", closedAt: Date.now() });

      if (roundNumber > 1) {
        const nextRoundNumber = roundNumber - 1;
        const nextRound = await getRoundByNumber(ctx.db, sessionId, nextRoundNumber);
        if (!nextRound) throw new Error("Next round not found");

        await ctx.db.patch(nextRound._id, { state: "open", startedAt: Date.now() });
        await ctx.db.patch(sessionId, { activeRoundNumber: nextRoundNumber });
      }
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
    if (!identity) throw new Error("Unauthenticated");
    const uid = identity.subject;

    const round = await getRoundByNumber(ctx.db, sessionId, roundNumber);
    if (!round) throw new Error("Round not found");

    const existing = await ctx.db
      .query("selections")
      .withIndex("by_round_uid", (q) => q.eq("roundId", round._id).eq("uid", uid))
      .unique();

    if (!existing) throw new Error("Selection not found");

    await ctx.db.patch(existing._id, {
      pick: buildPickArg(option),
      savedAt: Date.now(),
    });
  },
});

export const getResults = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
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
