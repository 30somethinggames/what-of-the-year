import { describe, expect, it } from "bun:test";

import { api } from "../_generated/api";
import { HOST_UID, MEMBER_UID, OUTSIDER_UID, seedActiveGame, setupTest } from "./harness.setup";

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
