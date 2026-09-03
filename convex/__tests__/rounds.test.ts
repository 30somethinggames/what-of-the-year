import { describe, expect, it } from "bun:test";

import { api, internal } from "../_generated/api";
import { MAX_ROUNDS, SessionStatus } from "../constants";
import {
  HOST_UID,
  MEMBER_UID,
  OUTSIDER_UID,
  seedActiveGame,
  seedSelection,
  setupTest,
} from "./harness.setup";

describe("getRound", () => {
  it("throws for a non-member", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: OUTSIDER_UID })
        .query(api.rounds.getRound, { sessionId, number: MAX_ROUNDS }),
    ).rejects.toThrow(/NOT_MEMBER/);
  });

  it("returns the round for a member", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    const round = await t
      .withIdentity({ subject: MEMBER_UID })
      .query(api.rounds.getRound, { sessionId, number: MAX_ROUNDS });

    expect(round?.number).toBe(MAX_ROUNDS);
    expect(round?.state).toBe("open");
  });
});

describe("advanceRound", () => {
  it("throws when unauthenticated", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t.mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: MAX_ROUNDS }),
    ).rejects.toThrow(/UNAUTHENTICATED/);
  });

  it("throws for a non-member and leaves the round untouched", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: OUTSIDER_UID })
        .mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: MAX_ROUNDS }),
    ).rejects.toThrow(/NOT_MEMBER/);

    const session = await t.run(async (ctx) => await ctx.db.get(sessionId));
    expect(session?.activeRoundNumber).toBe(MAX_ROUNDS);
  });

  it("throws for a member who is not the host and leaves the round untouched", async () => {
    const t = await setupTest();
    const { sessionId, roundIds } = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: MEMBER_UID })
        .mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: MAX_ROUNDS }),
    ).rejects.toThrow(/NOT_HOST/);

    const round = await t.run(async (ctx) => await ctx.db.get(roundIds[MAX_ROUNDS - 1]));
    expect(round?.state).toBe("open");
  });

  it("lets the host advance an empty round to the next one", async () => {
    const t = await setupTest();
    const { sessionId, roundIds } = await seedActiveGame(t);

    const result = await t
      .withIdentity({ subject: HOST_UID })
      .mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: MAX_ROUNDS });

    expect(result).toEqual({ hasNextRound: true });

    const { closed, next, session } = await t.run(async (ctx) => ({
      closed: await ctx.db.get(roundIds[MAX_ROUNDS - 1]),
      next: await ctx.db.get(roundIds[MAX_ROUNDS - 2]),
      session: await ctx.db.get(sessionId),
    }));

    expect(closed?.state).toBe("closed");
    expect(next?.state).toBe("open");
    expect(session?.activeRoundNumber).toBe(MAX_ROUNDS - 1);
  });

  it("throws when the host re-advances an already closed round", async () => {
    const t = await setupTest();
    const { sessionId, roundIds } = await seedActiveGame(t);
    const host = t.withIdentity({ subject: HOST_UID });

    await host.mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: MAX_ROUNDS });

    await expect(
      host.mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: MAX_ROUNDS }),
    ).rejects.toThrow(/WRONG_STATE/);

    const { closed, next, session } = await t.run(async (ctx) => ({
      closed: await ctx.db.get(roundIds[MAX_ROUNDS - 1]),
      next: await ctx.db.get(roundIds[MAX_ROUNDS - 2]),
      session: await ctx.db.get(sessionId),
    }));

    expect(closed?.state).toBe("closed");
    expect(next?.state).toBe("open");
    expect(session?.activeRoundNumber).toBe(MAX_ROUNDS - 1);
  });

  it("throws when the host advances a round that has not started", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: HOST_UID })
        .mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: 1 }),
    ).rejects.toThrow(/WRONG_STATE/);
  });

  it("throws once the session has ended and leaves the rounds untouched", async () => {
    const t = await setupTest();
    const { sessionId, roundIds } = await seedActiveGame(t);
    const host = t.withIdentity({ subject: HOST_UID });

    await host.mutation(api.sessions.endSession, { sessionId });

    await expect(
      host.mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: MAX_ROUNDS }),
    ).rejects.toThrow(/WRONG_STATE/);

    const { current, next } = await t.run(async (ctx) => ({
      current: await ctx.db.get(roundIds[MAX_ROUNDS - 1]),
      next: await ctx.db.get(roundIds[MAX_ROUNDS - 2]),
    }));

    expect(current?.state).toBe("open");
    expect(next?.state).toBe("pending");
  });
});

describe("completeReveal", () => {
  it("closes the revealing round and opens the next one", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    await seedSelection(t, game, MEMBER_UID);
    const { sessionId, roundIds } = game;

    await t
      .withIdentity({ subject: HOST_UID })
      .mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: MAX_ROUNDS });

    await t.mutation(internal.rounds.completeReveal, { sessionId, roundNumber: MAX_ROUNDS });

    const { session, current, next } = await t.run(async (ctx) => ({
      session: await ctx.db.get(sessionId),
      current: await ctx.db.get(roundIds[MAX_ROUNDS - 1]),
      next: await ctx.db.get(roundIds[MAX_ROUNDS - 2]),
    }));

    expect(session?.activeRoundNumber).toBe(MAX_ROUNDS - 1);
    expect(current?.state).toBe("closed");
    expect(next?.state).toBe("open");
  });

  it("does nothing once the session has ended", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    await seedSelection(t, game, MEMBER_UID);
    const host = t.withIdentity({ subject: HOST_UID });
    const { sessionId, roundIds } = game;

    await host.mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: MAX_ROUNDS });
    await host.mutation(api.sessions.endSession, { sessionId });

    await t.mutation(internal.rounds.completeReveal, { sessionId, roundNumber: MAX_ROUNDS });

    const { session, current, next } = await t.run(async (ctx) => ({
      session: await ctx.db.get(sessionId),
      current: await ctx.db.get(roundIds[MAX_ROUNDS - 1]),
      next: await ctx.db.get(roundIds[MAX_ROUNDS - 2]),
    }));

    expect(session?.status).toBe(SessionStatus.ENDED);
    expect(session?.activeRoundNumber).toBe(MAX_ROUNDS);
    expect(current?.state).toBe("revealing");
    expect(next?.state).toBe("pending");
  });
});
