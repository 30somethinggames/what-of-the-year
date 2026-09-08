import { afterAll, beforeAll, describe, expect, it } from "bun:test";

import type { Doc, Id } from "../_generated/dataModel";
import { MAX_ROUNDS, SessionStatus } from "../constants";
import { setupTest } from "./harness.setup";

const SECRET = "secret-of-exactly-this-length-ok";
const WRONG = "wrong-of-exactly-this-length-abc";

const CREATE = "/test/create-session";
const SEED = "/test/seed-game";

type TestConvex = Awaited<ReturnType<typeof setupTest>>;

const realSecret = process.env.TEST_SECRET;
const realIsProd = process.env.IS_PROD;

beforeAll(() => {
  process.env.TEST_SECRET = SECRET;
  delete process.env.IS_PROD;
});

afterAll(() => {
  if (realSecret === undefined) delete process.env.TEST_SECRET;
  else process.env.TEST_SECRET = realSecret;
  if (realIsProd === undefined) delete process.env.IS_PROD;
  else process.env.IS_PROD = realIsProd;
});

/** `freshHttp` so the routes are registered against the secret set just above. */
function post(t: TestConvex, path: string, body: unknown, secret: string | null = SECRET) {
  return t.fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret === null ? {} : { "x-test-secret": secret }),
    },
    body: JSON.stringify(body),
  });
}

async function readGame(t: TestConvex, sessionId: Id<"sessions">) {
  return await t.run(async (ctx) => ({
    session: await ctx.db.get(sessionId),
    players: await ctx.db
      .query("players")
      .withIndex("by_session_uid", (q) => q.eq("sessionId", sessionId))
      .collect(),
    rounds: (
      await ctx.db
        .query("rounds")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect()
    ).sort((a, b) => a.number - b.number),
    selections: await ctx.db
      .query("selections")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect(),
  }));
}

/** Round states low number first, so a phase reads as a picture of the game. */
function states(rounds: Doc<"rounds">[]) {
  return rounds.map((round) => round.state);
}

describe("POST /test/create-session", () => {
  it("rejects a request with no secret", async () => {
    const t = await setupTest({ freshHttp: true });

    const response = await post(t, CREATE, { name: "Host" }, null);

    expect(response.status).toBe(401);
  });

  it("rejects a request with the wrong secret", async () => {
    const t = await setupTest({ freshHttp: true });

    const response = await post(t, CREATE, { name: "Host" }, WRONG);

    expect(response.status).toBe(401);
  });

  it("creates a lobby session hosted by the named player", async () => {
    const t = await setupTest({ freshHttp: true });

    const response = await post(t, CREATE, { name: "Ryan", topic: "movies", year: 2024 });

    expect(response.status).toBe(200);
    const { sessionId, hostUid } = (await response.json()) as {
      sessionId: Id<"sessions">;
      hostUid: string;
    };
    expect(hostUid).toMatch(/^test-/);

    const { session, players, rounds } = await readGame(t, sessionId);

    expect(session).toMatchObject({
      topic: "movies",
      year: 2024,
      status: SessionStatus.LOBBY,
      playerCount: 1,
      activeRoundNumber: 1,
    });
    expect(players).toHaveLength(1);
    expect(players[0]).toMatchObject({ uid: hostUid, name: "Ryan", isHost: true });
    expect(rounds).toHaveLength(MAX_ROUNDS);
    expect(states(rounds).every((state) => state === "pending")).toBe(true);
  });

  it("hosts the session as the uid it is given", async () => {
    const t = await setupTest({ freshHttp: true });

    const response = await post(t, CREATE, { name: "Ryan", hostUid: "browser-uid" });

    expect((await response.json()).hostUid).toBe("browser-uid");
  });
});

describe("POST /test/seed-game", () => {
  const players = [{ name: "Host" }, { name: "Guest" }];

  it("rejects a request with no secret", async () => {
    const t = await setupTest({ freshHttp: true });

    const response = await post(t, SEED, { phase: "lobby", players }, null);

    expect(response.status).toBe(401);
  });

  it("opens the requested round and closes the ones already played", async () => {
    const t = await setupTest({ freshHttp: true });

    const response = await post(t, SEED, { phase: "round:8", players });

    expect(response.status).toBe(200);
    const { sessionId, roundIds, players: seeded } = await response.json();

    expect(roundIds).toHaveLength(MAX_ROUNDS);
    expect(seeded.map((player: { isHost: boolean }) => player.isHost)).toEqual([true, false]);

    const { session, rounds } = await readGame(t, sessionId);

    expect(session).toMatchObject({
      status: SessionStatus.ACTIVE,
      activeRoundNumber: 8,
      playerCount: 2,
    });
    // Rounds count down: 1-7 are still to come, 8 is in play, 9 and 10 are done.
    expect(states(rounds)).toEqual([
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
      "open",
      "closed",
      "closed",
    ]);
  });

  it("puts a revealing round in play with the reveal job the timeout needs", async () => {
    const t = await setupTest({ freshHttp: true });

    const response = await post(t, SEED, {
      phase: `revealing:${MAX_ROUNDS}`,
      players,
      selections: [
        { uid: "a", roundNumber: MAX_ROUNDS, pickName: "Blue Prince" },
        { uid: "b", roundNumber: MAX_ROUNDS, pickName: "Balatro" },
      ],
    });

    const { sessionId } = await response.json();
    const { session, rounds, selections } = await readGame(t, sessionId);
    const revealing = rounds[MAX_ROUNDS - 1]!;

    expect(session).toMatchObject({ status: SessionStatus.ACTIVE, activeRoundNumber: MAX_ROUNDS });
    expect(revealing.state).toBe("revealing");
    expect(revealing.selectionsComplete).toBe(2);
    expect(revealing.closedAt).not.toBeNull();
    expect(revealing.revealJobId).toBeDefined();
    expect(revealing.revealEndsAt).toBeGreaterThan(Date.now());

    expect(selections).toHaveLength(2);
    expect(selections.map((selection) => selection.pick)).toContainEqual({
      id: "blue-prince",
      name: "Blue Prince",
    });

    // The seeded job is the real `completeReveal`, so the round closes itself
    // on timeout exactly as one `advanceRound` opened would.
    const job = await t.run(async (ctx) => await ctx.db.system.get(revealing.revealJobId!));
    expect(job?.name).toBe("rounds:completeReveal");
    expect(job?.state.kind).toBe("pending");
    expect(job?.args[0]).toEqual({ sessionId, roundNumber: MAX_ROUNDS });
  });

  it("closes every round of an ended game and completes the session", async () => {
    const t = await setupTest({ freshHttp: true });

    const response = await post(t, SEED, { phase: "ended", players });

    const { sessionId } = await response.json();
    const { session, rounds } = await readGame(t, sessionId);

    expect(session).toMatchObject({ status: SessionStatus.COMPLETE, activeRoundNumber: 1 });
    expect(states(rounds).every((state) => state === "closed")).toBe(true);
  });

  it("refuses a phase it does not recognise", async () => {
    const t = await setupTest({ freshHttp: true });

    expect(post(t, SEED, { phase: "round:0", players })).rejects.toThrow(/out of range/);
    expect(post(t, SEED, { phase: "halftime", players })).rejects.toThrow(/Unknown phase/);
  });
});

describe("the /test/* routes on prod", () => {
  it("registers none of them when IS_PROD is set", async () => {
    process.env.IS_PROD = "1";
    try {
      const t = await setupTest({ freshHttp: true });

      for (const path of [CREATE, SEED, "/test/add-player", "/test/make-selection"]) {
        expect((await post(t, path, {})).status).toBe(404);
      }
      expect((await post(t, "/test/cleanup", {})).status).toBe(404);
    } finally {
      delete process.env.IS_PROD;
    }
  });
});
