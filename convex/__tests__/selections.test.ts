import { describe, expect, it } from "bun:test";

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { MAX_ROUNDS } from "../constants";
import {
  MEMBER_UID,
  OPTION,
  OUTSIDER_UID,
  seedActiveGame,
  setupTest,
  type SeededGame,
} from "./harness.setup";

type TestConvex = Awaited<ReturnType<typeof setupTest>>;

async function seedSelection(t: TestConvex, game: SeededGame, uid: string) {
  await t.run(async (ctx) => {
    await ctx.db.insert("selections", {
      sessionId: game.sessionId,
      roundId: game.roundIds[MAX_ROUNDS - 1],
      uid,
      pick: { id: String(OPTION.id), name: OPTION.name },
      points: 1,
      roundNumber: MAX_ROUNDS,
      savedAt: Date.now(),
    });
  });
}

async function setRoundState(
  t: TestConvex,
  roundId: Id<"rounds">,
  state: "pending" | "open" | "closed" | "revealing",
) {
  await t.run(async (ctx) => await ctx.db.patch(roundId, { state }));
}

async function pickNames(t: TestConvex, sessionId: Id<"sessions">) {
  return await t.run(async (ctx) => {
    const selections = await ctx.db
      .query("selections")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    return selections.map((s) => s.pick.name);
  });
}

describe("saveSelection", () => {
  it("throws when unauthenticated", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t.mutation(api.selections.saveSelection, {
        sessionId,
        roundNumber: MAX_ROUNDS,
        option: OPTION,
      }),
    ).rejects.toThrow(/UNAUTHENTICATED/);
  });

  it("throws for a non-member and writes nothing", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await expect(
      t.withIdentity({ subject: OUTSIDER_UID }).mutation(api.selections.saveSelection, {
        sessionId,
        roundNumber: MAX_ROUNDS,
        option: OPTION,
      }),
    ).rejects.toThrow(/NOT_MEMBER/);

    expect(await pickNames(t, sessionId)).toEqual([]);
  });

  it("throws when the round is not open", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    await setRoundState(t, game.roundIds[MAX_ROUNDS - 1], "revealing");

    await expect(
      t.withIdentity({ subject: MEMBER_UID }).mutation(api.selections.saveSelection, {
        sessionId: game.sessionId,
        roundNumber: MAX_ROUNDS,
        option: OPTION,
      }),
    ).rejects.toThrow(/WRONG_STATE/);

    expect(await pickNames(t, game.sessionId)).toEqual([]);
  });

  it("saves a pick for a member on an open round", async () => {
    const t = await setupTest();
    const { sessionId } = await seedActiveGame(t);

    await t.withIdentity({ subject: MEMBER_UID }).mutation(api.selections.saveSelection, {
      sessionId,
      roundNumber: MAX_ROUNDS,
      option: OPTION,
    });

    expect(await pickNames(t, sessionId)).toEqual(["Blue Prince"]);
  });
});

describe("editSelection", () => {
  it("throws when unauthenticated", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    await seedSelection(t, game, MEMBER_UID);

    await expect(
      t.mutation(api.selections.editSelection, {
        sessionId: game.sessionId,
        roundNumber: MAX_ROUNDS,
        option: { ...OPTION, name: "Overwritten" },
      }),
    ).rejects.toThrow(/UNAUTHENTICATED/);
  });

  it("throws for a non-member and leaves the pick intact", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    await seedSelection(t, game, MEMBER_UID);

    await expect(
      t.withIdentity({ subject: OUTSIDER_UID }).mutation(api.selections.editSelection, {
        sessionId: game.sessionId,
        roundNumber: MAX_ROUNDS,
        option: { ...OPTION, name: "Overwritten" },
      }),
    ).rejects.toThrow(/NOT_MEMBER/);

    expect(await pickNames(t, game.sessionId)).toEqual(["Blue Prince"]);
  });

  it("throws once the round has closed and leaves the pick intact", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    await seedSelection(t, game, MEMBER_UID);
    await setRoundState(t, game.roundIds[MAX_ROUNDS - 1], "closed");

    await expect(
      t.withIdentity({ subject: MEMBER_UID }).mutation(api.selections.editSelection, {
        sessionId: game.sessionId,
        roundNumber: MAX_ROUNDS,
        option: { ...OPTION, name: "Overwritten" },
      }),
    ).rejects.toThrow(/WRONG_STATE/);

    expect(await pickNames(t, game.sessionId)).toEqual(["Blue Prince"]);
  });

  it("throws while the round is revealing and leaves the pick intact", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    await seedSelection(t, game, MEMBER_UID);
    await setRoundState(t, game.roundIds[MAX_ROUNDS - 1], "revealing");

    await expect(
      t.withIdentity({ subject: MEMBER_UID }).mutation(api.selections.editSelection, {
        sessionId: game.sessionId,
        roundNumber: MAX_ROUNDS,
        option: { ...OPTION, name: "Overwritten" },
      }),
    ).rejects.toThrow(/WRONG_STATE/);

    expect(await pickNames(t, game.sessionId)).toEqual(["Blue Prince"]);
  });

  it("rewrites the pick for a member while the round is open", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    await seedSelection(t, game, MEMBER_UID);

    await t.withIdentity({ subject: MEMBER_UID }).mutation(api.selections.editSelection, {
      sessionId: game.sessionId,
      roundNumber: MAX_ROUNDS,
      option: { ...OPTION, name: "Overwritten" },
    });

    expect(await pickNames(t, game.sessionId)).toEqual(["Overwritten"]);
  });
});

describe("selection queries", () => {
  it("throw for a non-member", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    await seedSelection(t, game, MEMBER_UID);

    const asOutsider = t.withIdentity({ subject: OUTSIDER_UID });
    const { sessionId } = game;

    await expect(
      asOutsider.query(api.selections.getSelections, { sessionId, number: MAX_ROUNDS }),
    ).rejects.toThrow(/NOT_MEMBER/);
    await expect(asOutsider.query(api.selections.getMySelections, { sessionId })).rejects.toThrow(
      /NOT_MEMBER/,
    );
    await expect(asOutsider.query(api.selections.getResults, { sessionId })).rejects.toThrow(
      /NOT_MEMBER/,
    );
  });

  it("return data for a member", async () => {
    const t = await setupTest();
    const game = await seedActiveGame(t);
    await seedSelection(t, game, MEMBER_UID);

    const asMember = t.withIdentity({ subject: MEMBER_UID });
    const { sessionId } = game;

    expect(
      await asMember.query(api.selections.getSelections, { sessionId, number: MAX_ROUNDS }),
    ).toHaveLength(1);
    expect(await asMember.query(api.selections.getMySelections, { sessionId })).toHaveLength(1);
    expect(await asMember.query(api.selections.getResults, { sessionId })).toEqual([
      {
        pick: { id: String(OPTION.id), name: OPTION.name },
        totalPoints: 1,
        votes: [{ playerName: "Member", playerAvatar: "🦊", points: 1 }],
      },
    ]);
  });
});
