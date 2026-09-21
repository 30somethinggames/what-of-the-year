import { describe, expect, it } from "bun:test";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { MAX_ROUNDS, SessionStatus } from "../constants";
import {
  HOST_UID,
  MEMBER_UID,
  OPTION,
  OUTSIDER_UID,
  seedActiveGame,
  seedCompleteGame,
  seedFinalRound,
  seedLobbyGame,
  seedSelection,
  setupTest,
  type SeededGame,
} from "./harness.setup";

type TestConvex = Awaited<ReturnType<typeof setupTest>>;

const GUEST_UID = "guest-uid";
const AVATAR = "https://api.dicebear.com/7.x/bottts/svg?seed=guest1";
const JOIN = { name: "Guest", avatar: AVATAR };

async function readSession(t: TestConvex, sessionId: Id<"sessions">) {
  return await t.run(async (ctx) => await ctx.db.get(sessionId));
}

async function readRound(t: TestConvex, roundId: Id<"rounds">) {
  return await t.run(async (ctx) => await ctx.db.get(roundId));
}

async function playerRow(t: TestConvex, sessionId: Id<"sessions">, uid: string) {
  return await t.run(
    async (ctx) =>
      await ctx.db
        .query("players")
        .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId).eq("uid", uid))
        .unique(),
  );
}

async function selectionsOf(t: TestConvex, sessionId: Id<"sessions">, uid: string) {
  return await t.run(async (ctx) => {
    const all = await ctx.db
      .query("selections")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    return all.filter((s) => s.uid === uid);
  });
}

/** A pick by `uid` on any round, not only the highest one `seedSelection` covers. */
async function insertSelection(t: TestConvex, game: SeededGame, uid: string, roundNumber: number) {
  await t.run(async (ctx) => {
    await ctx.db.insert("selections", {
      sessionId: game.sessionId,
      roundId: game.roundIds[roundNumber - 1]!,
      uid,
      pick: { id: String(OPTION.id), name: OPTION.name },
      points: MAX_ROUNDS + 1 - roundNumber,
      roundNumber,
      savedAt: Date.now(),
    });
  });
}

/** A third member, so a round can have one pick in and one still to come. */
async function addGuest(t: TestConvex, sessionId: Id<"sessions">) {
  await t.run(async (ctx) => {
    await ctx.db.insert("players", {
      sessionId,
      uid: GUEST_UID,
      name: "Guest",
      avatar: "🐝",
      isHost: false,
    });
    const session = await ctx.db.get(sessionId);
    await ctx.db.patch(sessionId, { playerCount: session!.playerCount + 1 });
  });
}

/** The session row alone, so a member lookup still succeeds against a missing session. */
async function deleteSessionRow(t: TestConvex, sessionId: Id<"sessions">) {
  await t.run(async (ctx) => await ctx.db.delete(sessionId));
}

describe("getPlayers", () => {
  it("throws when unauthenticated", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(t.query(api.players.getPlayers, { sessionId })).rejects.toThrow(/UNAUTHENTICATED/);
  });

  it("throws for a non-member instead of handing over the roster", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t.withIdentity({ subject: OUTSIDER_UID }).query(api.players.getPlayers, { sessionId }),
    ).rejects.toThrow(/NOT_MEMBER/);
  });

  it("returns the roster for a member", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    const players = await t
      .withIdentity({ subject: MEMBER_UID })
      .query(api.players.getPlayers, { sessionId });

    expect(players.map((p) => p.name).sort()).toEqual(["Host", "Member"]);
  });
});

describe("getMyPlayer", () => {
  it("throws when unauthenticated", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(t.query(api.players.getMyPlayer, { sessionId })).rejects.toThrow(
      /UNAUTHENTICATED/,
    );
  });

  it("returns null for a non-member so the join screen stays reachable", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    expect(
      await t.withIdentity({ subject: OUTSIDER_UID }).query(api.players.getMyPlayer, { sessionId }),
    ).toBeNull();
  });

  it("returns only the caller's own row", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    const me = await t
      .withIdentity({ subject: HOST_UID })
      .query(api.players.getMyPlayer, { sessionId });

    expect(me?.uid).toBe(HOST_UID);
    expect(me?.name).toBe("Host");
    expect(me?.isHost).toBe(true);
  });
});

describe("joinSession", () => {
  it("throws when unauthenticated and writes nothing", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(t.mutation(api.players.joinSession, { sessionId, ...JOIN })).rejects.toThrow(
      /UNAUTHENTICATED/,
    );

    expect((await readSession(t, sessionId))?.playerCount).toBe(2);
  });

  it("throws VALIDATION for a disallowed name", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(
      t
        .withIdentity({ subject: OUTSIDER_UID })
        .mutation(api.players.joinSession, { sessionId, name: "Guest!", avatar: AVATAR }),
    ).rejects.toThrow(/VALIDATION/);

    expect(await playerRow(t, sessionId, OUTSIDER_UID)).toBeNull();
  });

  it("throws VALIDATION for an avatar that is not a dicebear URL", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(
      t
        .withIdentity({ subject: OUTSIDER_UID })
        .mutation(api.players.joinSession, { sessionId, name: "Guest", avatar: "🐝" }),
    ).rejects.toThrow(/VALIDATION/);

    expect(await playerRow(t, sessionId, OUTSIDER_UID)).toBeNull();
  });

  it("throws NOT_FOUND for a session that no longer exists", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);
    await deleteSessionRow(t, sessionId);

    await expect(
      t
        .withIdentity({ subject: OUTSIDER_UID })
        .mutation(api.players.joinSession, { sessionId, ...JOIN }),
    ).rejects.toThrow(/NOT_FOUND/);
  });

  it("throws SESSION_CLOSED once the game has started", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: OUTSIDER_UID })
        .mutation(api.players.joinSession, { sessionId, ...JOIN }),
    ).rejects.toThrow(/SESSION_CLOSED/);

    expect(await playerRow(t, sessionId, OUTSIDER_UID)).toBeNull();
    expect((await readSession(t, sessionId))?.playerCount).toBe(2);
  });

  it("throws SESSION_FULL when the lobby holds maxPlayers", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);
    await t.run(async (ctx) => {
      const session = await ctx.db.get(sessionId);
      await ctx.db.patch(sessionId, { playerCount: session!.maxPlayers });
    });

    await expect(
      t
        .withIdentity({ subject: OUTSIDER_UID })
        .mutation(api.players.joinSession, { sessionId, ...JOIN }),
    ).rejects.toThrow(/SESSION_FULL/);

    const session = await readSession(t, sessionId);
    expect(await playerRow(t, sessionId, OUTSIDER_UID)).toBeNull();
    expect(session?.playerCount).toBe(session?.maxPlayers);
  });

  it("admits the last seat: one below maxPlayers joins", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);
    await t.run(async (ctx) => {
      const session = await ctx.db.get(sessionId);
      await ctx.db.patch(sessionId, { playerCount: session!.maxPlayers - 1 });
    });

    await t
      .withIdentity({ subject: OUTSIDER_UID })
      .mutation(api.players.joinSession, { sessionId, ...JOIN });

    const session = await readSession(t, sessionId);
    expect(session?.playerCount).toBe(session?.maxPlayers);
  });

  it("throws ALREADY_JOINED for a member and does not count them twice", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(
      t
        .withIdentity({ subject: MEMBER_UID })
        .mutation(api.players.joinSession, { sessionId, ...JOIN }),
    ).rejects.toThrow(/ALREADY_JOINED/);

    expect((await readSession(t, sessionId))?.playerCount).toBe(2);
  });

  it("adds a guest row, never a host, and counts them", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await t
      .withIdentity({ subject: OUTSIDER_UID })
      .mutation(api.players.joinSession, { sessionId, ...JOIN });

    const row = await playerRow(t, sessionId, OUTSIDER_UID);
    expect(row?.name).toBe("Guest");
    expect(row?.avatar).toBe(AVATAR);
    expect(row?.isHost).toBe(false);
    expect((await readSession(t, sessionId))?.playerCount).toBe(3);
  });

  it("throws RateLimited once the caller's bucket is empty, per user", async () => {
    const t = await setupTest();
    const guest = t.withIdentity({ subject: OUTSIDER_UID });

    for (let i = 0; i < 10; i++) {
      const { sessionId } = await seedLobbyGame(t);
      await guest.mutation(api.players.joinSession, { sessionId, ...JOIN });
    }

    const { sessionId } = await seedLobbyGame(t);
    await expect(guest.mutation(api.players.joinSession, { sessionId, ...JOIN })).rejects.toThrow(
      /RateLimited/,
    );
    expect(await playerRow(t, sessionId, OUTSIDER_UID)).toBeNull();
  });
});

describe("leaveSession", () => {
  it("throws when unauthenticated", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(t.mutation(api.players.leaveSession, { sessionId })).rejects.toThrow(
      /UNAUTHENTICATED/,
    );
  });

  it("throws NOT_FOUND for a session that no longer exists", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);
    await deleteSessionRow(t, sessionId);

    await expect(
      t.withIdentity({ subject: MEMBER_UID }).mutation(api.players.leaveSession, { sessionId }),
    ).rejects.toThrow(/NOT_FOUND/);
  });

  it("throws NOT_MEMBER for someone who never joined", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(
      t.withIdentity({ subject: OUTSIDER_UID }).mutation(api.players.leaveSession, { sessionId }),
    ).rejects.toThrow(/NOT_MEMBER/);

    expect((await readSession(t, sessionId))?.playerCount).toBe(2);
  });

  it("throws HOST_CANNOT_LEAVE for the host and keeps their row", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t.withIdentity({ subject: HOST_UID }).mutation(api.players.leaveSession, { sessionId }),
    ).rejects.toThrow(/HOST_CANNOT_LEAVE/);

    expect((await playerRow(t, sessionId, HOST_UID))?.isHost).toBe(true);
    expect((await readSession(t, sessionId))?.playerCount).toBe(2);
  });

  it("removes a guest from the lobby and leaves every round pending", async () => {
    const t = await setupTest();
    const game = await seedLobbyGame(t);
    const { sessionId } = game;

    await t.withIdentity({ subject: MEMBER_UID }).mutation(api.players.leaveSession, { sessionId });

    expect(await playerRow(t, sessionId, MEMBER_UID)).toBeNull();
    expect((await readSession(t, sessionId))?.playerCount).toBe(1);
    expect((await readRound(t, game.roundIds[0]!))?.state).toBe("pending");
  });

  it("deletes the leaver's picks on every round and nobody else's", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const { sessionId } = game;
    await seedSelection(t, game, HOST_UID);
    await insertSelection(t, game, MEMBER_UID, MAX_ROUNDS);
    await insertSelection(t, game, MEMBER_UID, MAX_ROUNDS - 1);

    await t.withIdentity({ subject: MEMBER_UID }).mutation(api.players.leaveSession, { sessionId });

    expect(await selectionsOf(t, sessionId, MEMBER_UID)).toHaveLength(0);
    expect(await selectionsOf(t, sessionId, HOST_UID)).toHaveLength(1);
    expect((await readSession(t, sessionId))?.playerCount).toBe(1);
  });

  it("closes the open round when the leaver was the last one still to pick", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const { sessionId } = game;
    await seedSelection(t, game, HOST_UID);

    await t.withIdentity({ subject: MEMBER_UID }).mutation(api.players.leaveSession, { sessionId });

    const current = await readRound(t, game.roundIds[MAX_ROUNDS - 1]!);
    const next = await readRound(t, game.roundIds[MAX_ROUNDS - 2]!);
    expect(current?.state).toBe("closed");
    expect(current?.selectionsComplete).toBe(1);
    expect(current?.closedAt).not.toBeNull();
    expect(next?.state).toBe("open");
    expect(next?.startedAt).not.toBeNull();
    expect((await readSession(t, sessionId))?.activeRoundNumber).toBe(MAX_ROUNDS - 1);
  });

  it("recounts and keeps the round open when nobody has picked yet", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const { sessionId } = game;
    await insertSelection(t, game, MEMBER_UID, MAX_ROUNDS);
    await t.run(async (ctx) => {
      await ctx.db.patch(game.roundIds[MAX_ROUNDS - 1]!, { selectionsComplete: 1 });
    });

    await t.withIdentity({ subject: MEMBER_UID }).mutation(api.players.leaveSession, { sessionId });

    const current = await readRound(t, game.roundIds[MAX_ROUNDS - 1]!);
    expect(current?.state).toBe("open");
    expect(current?.selectionsComplete).toBe(0);
    expect((await readSession(t, sessionId))?.activeRoundNumber).toBe(MAX_ROUNDS);
  });

  it("keeps the round open while another member still has to pick", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const { sessionId } = game;
    await addGuest(t, sessionId);
    await seedSelection(t, game, HOST_UID);

    await t.withIdentity({ subject: GUEST_UID }).mutation(api.players.leaveSession, { sessionId });

    const current = await readRound(t, game.roundIds[MAX_ROUNDS - 1]!);
    expect(current?.state).toBe("open");
    expect(current?.selectionsComplete).toBe(1);
    expect((await readSession(t, sessionId))?.playerCount).toBe(2);
  });

  it("closes the final round with no round after it to open", async () => {
    const t = await setupTest();
    const game = await seedFinalRound(t);
    const { sessionId } = game;
    await insertSelection(t, game, HOST_UID, 1);

    await t.withIdentity({ subject: MEMBER_UID }).mutation(api.players.leaveSession, { sessionId });

    expect((await readRound(t, game.roundIds[0]!))?.state).toBe("closed");
    expect((await readSession(t, sessionId))?.activeRoundNumber).toBe(1);
  });

  it("leaves a forfeited game's round alone even when the leaver was the last to pick", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const { sessionId } = game;
    await seedSelection(t, game, HOST_UID);
    await t
      .withIdentity({ subject: HOST_UID })
      .mutation(api.sessions.forfeitSession, { sessionId });

    await t.withIdentity({ subject: MEMBER_UID }).mutation(api.players.leaveSession, { sessionId });

    const current = await readRound(t, game.roundIds[MAX_ROUNDS - 1]!);
    expect(current?.state).toBe("open");
    expect(current?.selectionsComplete).toBe(0);
    expect((await readSession(t, sessionId))?.activeRoundNumber).toBe(MAX_ROUNDS);
    expect((await readSession(t, sessionId))?.playerCount).toBe(1);
  });

  it("leaves a revealing round alone: only an open round is recounted", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const { sessionId } = game;
    await seedSelection(t, game, HOST_UID);
    await t.run(async (ctx) => {
      await ctx.db.patch(game.roundIds[MAX_ROUNDS - 1]!, { state: "revealing" });
    });

    await t.withIdentity({ subject: MEMBER_UID }).mutation(api.players.leaveSession, { sessionId });

    const current = await readRound(t, game.roundIds[MAX_ROUNDS - 1]!);
    const next = await readRound(t, game.roundIds[MAX_ROUNDS - 2]!);
    expect(current?.state).toBe("revealing");
    expect(current?.selectionsComplete).toBe(0);
    expect(next?.state).toBe("pending");
    expect((await readSession(t, sessionId))?.activeRoundNumber).toBe(MAX_ROUNDS);
  });

  it("lets a guest leave a finished game without touching its rounds", async () => {
    const t = await setupTest();
    const game = await seedCompleteGame(t);
    const { sessionId } = game;

    await t.withIdentity({ subject: MEMBER_UID }).mutation(api.players.leaveSession, { sessionId });

    const session = await readSession(t, sessionId);
    expect(session?.status).toBe(SessionStatus.COMPLETE);
    expect(session?.playerCount).toBe(1);
    expect((await readRound(t, game.roundIds[0]!))?.state).toBe("closed");
  });
});

describe("kickFromLobby", () => {
  it("throws when unauthenticated", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(
      t.mutation(api.players.kickFromLobby, { sessionId, uid: MEMBER_UID }),
    ).rejects.toThrow(/UNAUTHENTICATED/);
  });

  it("throws NOT_HOST for a member and keeps the target", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(
      t
        .withIdentity({ subject: MEMBER_UID })
        .mutation(api.players.kickFromLobby, { sessionId, uid: HOST_UID }),
    ).rejects.toThrow(/NOT_HOST/);

    expect(await playerRow(t, sessionId, HOST_UID)).not.toBeNull();
  });

  it("throws NOT_HOST for someone outside the session", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(
      t
        .withIdentity({ subject: OUTSIDER_UID })
        .mutation(api.players.kickFromLobby, { sessionId, uid: MEMBER_UID }),
    ).rejects.toThrow(/NOT_HOST/);

    expect(await playerRow(t, sessionId, MEMBER_UID)).not.toBeNull();
  });

  it("throws NOT_FOUND for a uid that is not in the session", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(
      t
        .withIdentity({ subject: HOST_UID })
        .mutation(api.players.kickFromLobby, { sessionId, uid: OUTSIDER_UID }),
    ).rejects.toThrow(/NOT_FOUND/);

    expect((await readSession(t, sessionId))?.playerCount).toBe(2);
  });

  it("throws CANNOT_KICK_HOST when the host targets themself", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await expect(
      t
        .withIdentity({ subject: HOST_UID })
        .mutation(api.players.kickFromLobby, { sessionId, uid: HOST_UID }),
    ).rejects.toThrow(/CANNOT_KICK_HOST/);

    expect(await playerRow(t, sessionId, HOST_UID)).not.toBeNull();
  });

  it("throws NOT_FOUND when the session row is gone", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);
    await deleteSessionRow(t, sessionId);

    await expect(
      t
        .withIdentity({ subject: HOST_UID })
        .mutation(api.players.kickFromLobby, { sessionId, uid: MEMBER_UID }),
    ).rejects.toThrow(/NOT_FOUND/);
  });

  it("throws WRONG_STATE once the game has started and keeps the target", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: HOST_UID })
        .mutation(api.players.kickFromLobby, { sessionId, uid: MEMBER_UID }),
    ).rejects.toThrow(/WRONG_STATE/);

    expect(await playerRow(t, sessionId, MEMBER_UID)).not.toBeNull();
    expect((await readSession(t, sessionId))?.playerCount).toBe(2);
  });

  it("removes the guest and counts them out for the host", async () => {
    const t = await setupTest();
    const { sessionId } = await seedLobbyGame(t);

    await t
      .withIdentity({ subject: HOST_UID })
      .mutation(api.players.kickFromLobby, { sessionId, uid: MEMBER_UID });

    expect(await playerRow(t, sessionId, MEMBER_UID)).toBeNull();
    expect((await readSession(t, sessionId))?.playerCount).toBe(1);
  });
});

describe("kickFromGame", () => {
  it("throws when unauthenticated", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t.mutation(api.players.kickFromGame, { sessionId, uid: MEMBER_UID }),
    ).rejects.toThrow(/UNAUTHENTICATED/);
  });

  it("throws NOT_HOST for a member and keeps the target", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: MEMBER_UID })
        .mutation(api.players.kickFromGame, { sessionId, uid: HOST_UID }),
    ).rejects.toThrow(/NOT_HOST/);

    expect(await playerRow(t, sessionId, HOST_UID)).not.toBeNull();
  });

  it("throws NOT_HOST for someone outside the session", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: OUTSIDER_UID })
        .mutation(api.players.kickFromGame, { sessionId, uid: MEMBER_UID }),
    ).rejects.toThrow(/NOT_HOST/);

    expect(await playerRow(t, sessionId, MEMBER_UID)).not.toBeNull();
  });

  it("throws NOT_FOUND for a uid that is not in the session", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: HOST_UID })
        .mutation(api.players.kickFromGame, { sessionId, uid: OUTSIDER_UID }),
    ).rejects.toThrow(/NOT_FOUND/);

    expect((await readSession(t, sessionId))?.playerCount).toBe(2);
  });

  it("throws CANNOT_KICK_HOST when the host targets themself", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t
        .withIdentity({ subject: HOST_UID })
        .mutation(api.players.kickFromGame, { sessionId, uid: HOST_UID }),
    ).rejects.toThrow(/CANNOT_KICK_HOST/);

    expect(await playerRow(t, sessionId, HOST_UID)).not.toBeNull();
  });

  it("throws NOT_FOUND when the session row is gone", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);
    await deleteSessionRow(t, sessionId);

    await expect(
      t
        .withIdentity({ subject: HOST_UID })
        .mutation(api.players.kickFromGame, { sessionId, uid: MEMBER_UID }),
    ).rejects.toThrow(/NOT_FOUND/);
  });

  it("removes the guest, their picks on every round, and recounts the open round", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const { sessionId } = game;
    await insertSelection(t, game, MEMBER_UID, MAX_ROUNDS);
    await insertSelection(t, game, MEMBER_UID, MAX_ROUNDS - 1);
    await t.run(async (ctx) => {
      await ctx.db.patch(game.roundIds[MAX_ROUNDS - 1]!, { selectionsComplete: 1 });
    });

    await t
      .withIdentity({ subject: HOST_UID })
      .mutation(api.players.kickFromGame, { sessionId, uid: MEMBER_UID });

    const current = await readRound(t, game.roundIds[MAX_ROUNDS - 1]!);
    expect(await playerRow(t, sessionId, MEMBER_UID)).toBeNull();
    expect(await selectionsOf(t, sessionId, MEMBER_UID)).toHaveLength(0);
    expect((await readSession(t, sessionId))?.playerCount).toBe(1);
    expect(current?.state).toBe("open");
    expect(current?.selectionsComplete).toBe(0);
  });

  it("closes the open round when the kicked player was the last one still to pick", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const { sessionId } = game;
    await seedSelection(t, game, HOST_UID);

    await t
      .withIdentity({ subject: HOST_UID })
      .mutation(api.players.kickFromGame, { sessionId, uid: MEMBER_UID });

    const current = await readRound(t, game.roundIds[MAX_ROUNDS - 1]!);
    const next = await readRound(t, game.roundIds[MAX_ROUNDS - 2]!);
    expect(current?.state).toBe("closed");
    expect(current?.selectionsComplete).toBe(1);
    expect(current?.closedAt).not.toBeNull();
    expect(next?.state).toBe("open");
    expect(next?.startedAt).not.toBeNull();
    expect((await readSession(t, sessionId))?.activeRoundNumber).toBe(MAX_ROUNDS - 1);
  });

  it("keeps the round open while another member still has to pick", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const { sessionId } = game;
    await addGuest(t, sessionId);
    await seedSelection(t, game, HOST_UID);

    await t
      .withIdentity({ subject: HOST_UID })
      .mutation(api.players.kickFromGame, { sessionId, uid: GUEST_UID });

    const current = await readRound(t, game.roundIds[MAX_ROUNDS - 1]!);
    expect(current?.state).toBe("open");
    expect(current?.selectionsComplete).toBe(1);
    expect((await readSession(t, sessionId))?.playerCount).toBe(2);
  });

  it("leaves a revealing round alone: only an open round is recounted", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    const { sessionId } = game;
    await seedSelection(t, game, HOST_UID);
    await t.run(async (ctx) => {
      await ctx.db.patch(game.roundIds[MAX_ROUNDS - 1]!, { state: "revealing" });
    });

    await t
      .withIdentity({ subject: HOST_UID })
      .mutation(api.players.kickFromGame, { sessionId, uid: MEMBER_UID });

    const current = await readRound(t, game.roundIds[MAX_ROUNDS - 1]!);
    const next = await readRound(t, game.roundIds[MAX_ROUNDS - 2]!);
    expect(current?.state).toBe("revealing");
    expect(current?.selectionsComplete).toBe(0);
    expect(next?.state).toBe("pending");
    expect((await readSession(t, sessionId))?.activeRoundNumber).toBe(MAX_ROUNDS);
  });

  it("closes the final round with no round after it to open", async () => {
    const t = await setupTest();
    const game = await seedFinalRound(t);
    const { sessionId } = game;
    await insertSelection(t, game, HOST_UID, 1);

    await t
      .withIdentity({ subject: HOST_UID })
      .mutation(api.players.kickFromGame, { sessionId, uid: MEMBER_UID });

    expect((await readRound(t, game.roundIds[0]!))?.state).toBe("closed");
    expect((await readSession(t, sessionId))?.activeRoundNumber).toBe(1);
  });
});
