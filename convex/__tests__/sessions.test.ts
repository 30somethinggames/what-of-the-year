import { describe, expect, it } from "bun:test";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { MAX_ROUNDS, SessionStatus } from "../constants";
import {
  HOST_UID,
  MEMBER_UID,
  OUTSIDER_UID,
  seedActiveGame,
  seedLobbyGame,
  seedSelection,
  setupTest,
  type SeededGame,
} from "./harness.setup";

type TestConvex = Awaited<ReturnType<typeof setupTest>>;

async function readGame(t: TestConvex, game: SeededGame) {
  return await t.run(async (ctx) => ({
    session: await ctx.db.get(game.sessionId),
    current: await ctx.db.get(game.roundIds[MAX_ROUNDS - 1]),
    next: await ctx.db.get(game.roundIds[MAX_ROUNDS - 2]),
  }));
}

async function jobState(t: TestConvex, jobId: Id<"_scheduled_functions">) {
  return await t.run(async (ctx) => (await ctx.db.system.get(jobId))?.state.kind);
}

describe("getSession", () => {
  it("throws when unauthenticated", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(t.query(api.sessions.getSession, { sessionId })).rejects.toThrow(
      /UNAUTHENTICATED/,
    );
  });

  it("stays auth-only: a non-member reads the session so the invite link works", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    const session = await t
      .withIdentity({ subject: OUTSIDER_UID })
      .query(api.sessions.getSession, { sessionId });

    expect(session?.status).toBe(SessionStatus.LOBBY);
  });
});

describe("startSession", () => {
  it("throws when unauthenticated", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(t.mutation(api.sessions.startSession, { sessionId })).rejects.toThrow(
      /UNAUTHENTICATED/,
    );
  });

  it("throws for a non-member and leaves the session in the lobby", async () => {
    const t = await setupTest();
    const game = await seedLobbyGame(t);

    await expect(
      t
        .withIdentity({ subject: OUTSIDER_UID })
        .mutation(api.sessions.startSession, { sessionId: game.sessionId }),
    ).rejects.toThrow(/NOT_HOST/);

    const { session } = await readGame(t, game);
    expect(session?.status).toBe(SessionStatus.LOBBY);
  });

  it("throws for a member who is not the host and leaves the session in the lobby", async () => {
    const t = await setupTest();
    const game = await seedLobbyGame(t);

    await expect(
      t
        .withIdentity({ subject: MEMBER_UID })
        .mutation(api.sessions.startSession, { sessionId: game.sessionId }),
    ).rejects.toThrow(/NOT_HOST/);

    const { session, current } = await readGame(t, game);
    expect(session?.status).toBe(SessionStatus.LOBBY);
    expect(current?.state).toBe("pending");
  });

  it("opens the highest round for the host", async () => {
    const t = await setupTest();
    const game = await seedLobbyGame(t);

    await t
      .withIdentity({ subject: HOST_UID })
      .mutation(api.sessions.startSession, { sessionId: game.sessionId });

    const { session, current } = await readGame(t, game);
    expect(session?.status).toBe(SessionStatus.ACTIVE);
    expect(session?.activeRoundNumber).toBe(MAX_ROUNDS);
    expect(current?.state).toBe("open");
  });

  it("throws on a second start and leaves the game where it was", async () => {
    const t = await setupTest();
    const game = await seedLobbyGame(t);
    const host = t.withIdentity({ subject: HOST_UID });
    const { sessionId } = game;

    await host.mutation(api.sessions.startSession, { sessionId });
    await host.mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: MAX_ROUNDS });

    await expect(host.mutation(api.sessions.startSession, { sessionId })).rejects.toThrow(
      /WRONG_STATE/,
    );

    const { session, current, next } = await readGame(t, game);
    expect(session?.activeRoundNumber).toBe(MAX_ROUNDS - 1);
    expect(current?.state).toBe("closed");
    expect(next?.state).toBe("open");
  });

  it("throws once the session has ended", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const host = t.withIdentity({ subject: HOST_UID });

    await host.mutation(api.sessions.endSession, { sessionId: game.sessionId });

    await expect(
      host.mutation(api.sessions.startSession, { sessionId: game.sessionId }),
    ).rejects.toThrow(/WRONG_STATE/);

    const { session } = await readGame(t, game);
    expect(session?.status).toBe(SessionStatus.ENDED);
  });
});

describe("endSession", () => {
  it("throws when unauthenticated", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(t.mutation(api.sessions.endSession, { sessionId })).rejects.toThrow(
      /UNAUTHENTICATED/,
    );
  });

  it("throws for a non-member and leaves the session active", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: OUTSIDER_UID })
        .mutation(api.sessions.endSession, { sessionId: game.sessionId }),
    ).rejects.toThrow(/NOT_HOST/);

    const { session } = await readGame(t, game);
    expect(session?.status).toBe(SessionStatus.ACTIVE);
  });

  it("throws for a member who is not the host and leaves the session active", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: MEMBER_UID })
        .mutation(api.sessions.endSession, { sessionId: game.sessionId }),
    ).rejects.toThrow(/NOT_HOST/);

    const { session } = await readGame(t, game);
    expect(session?.status).toBe(SessionStatus.ACTIVE);
  });

  it("ends the session for the host", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);

    await t
      .withIdentity({ subject: HOST_UID })
      .mutation(api.sessions.endSession, { sessionId: game.sessionId });

    const { session } = await readGame(t, game);
    expect(session?.status).toBe(SessionStatus.ENDED);
  });

  it("throws when the session has already ended", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const host = t.withIdentity({ subject: HOST_UID });

    await host.mutation(api.sessions.endSession, { sessionId: game.sessionId });

    await expect(
      host.mutation(api.sessions.endSession, { sessionId: game.sessionId }),
    ).rejects.toThrow(/SESSION_CLOSED/);
  });

  it("cancels the pending reveal job and clears the round's reveal fields", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    await seedSelection(t, game, MEMBER_UID);
    const host = t.withIdentity({ subject: HOST_UID });
    const { sessionId } = game;

    await host.mutation(api.rounds.advanceRound, { sessionId, currentRoundNumber: MAX_ROUNDS });

    const revealing = await t.run(async (ctx) => await ctx.db.get(game.roundIds[MAX_ROUNDS - 1]));
    const jobId = revealing?.revealJobId;
    if (!jobId) throw new Error("Expected advanceRound to schedule a reveal job");
    expect(await jobState(t, jobId)).toBe("pending");

    await host.mutation(api.sessions.endSession, { sessionId });

    expect(await jobState(t, jobId)).toBe("canceled");

    const { current } = await readGame(t, game);
    expect(current?.revealJobId).toBeUndefined();
    expect(current?.revealEndsAt).toBeUndefined();
  });
});
