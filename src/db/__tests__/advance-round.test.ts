import { afterEach, describe, expect, it, mock } from "bun:test";

const mockUpdate = mock(() => {});
const mockCommit = mock(() => Promise.resolve());

mock.module("db/config", () => ({
  db: {},
}));

mock.module("db/collections", () => ({
  sessionsRef: () => ({ path: "sessions" }),
  sessionRef: (sessionId: string) => ({ _type: "sessionRef", sessionId }),
  playersRef: (sessionId: string) => ({ path: `sessions/${sessionId}/players` }),
  playerRef: (sessionId: string, uid: string) => ({
    path: `sessions/${sessionId}/players/${uid}`,
    id: uid,
  }),
  roundsRef: (sessionId: string) => ({ path: `sessions/${sessionId}/rounds` }),
  roundRef: (sessionId: string, roundNumber: number) => ({
    _type: "roundRef",
    sessionId,
    roundNumber,
  }),
  selectionsRef: (sessionId: string, roundNumber: number) => ({
    path: `sessions/${sessionId}/rounds/${roundNumber}/selections`,
  }),
  selectionRef: (sessionId: string, roundNumber: number, uid: string) => ({
    path: `sessions/${sessionId}/rounds/${roundNumber}/selections/${uid}`,
  }),
}));

mock.module("firebase/firestore", () => ({
  writeBatch: () => ({ update: mockUpdate, commit: mockCommit }),
  serverTimestamp: () => ({ _type: "serverTimestamp" }),
  Timestamp: { fromMillis: (ms: number) => ({ _type: "timestamp", ms }) },
  doc: (...segments: string[]) => ({ path: segments.join("/") }),
  collection: (...segments: string[]) => ({ path: segments.join("/") }),
  runTransaction: () => Promise.resolve(),
  increment: (n: number) => ({ _type: "increment", value: n }),
}));

const { advanceRound } = await import("../utils/advance-round");

describe("advanceRound", () => {
  afterEach(() => {
    mockUpdate.mockClear();
    mockCommit.mockClear();
  });

  it("closes current round, opens next round, and updates session when not at max", async () => {
    const result = await advanceRound({
      sessionId: "session-1",
      currentRoundNumber: 3,
      maxRounds: 10,
    });

    expect(result).toEqual({ hasNextRound: true });

    expect(mockUpdate).toHaveBeenCalledTimes(3);

    // Close current round
    const closeCall = mockUpdate.mock.calls[0] as unknown[];
    expect(closeCall[0]).toEqual({ _type: "roundRef", sessionId: "session-1", roundNumber: 3 });
    expect(closeCall[1]).toEqual({
      state: "closed",
      closedAt: { _type: "serverTimestamp" },
    });

    // Open next round
    const openCall = mockUpdate.mock.calls[1] as unknown[];
    expect(openCall[0]).toEqual({ _type: "roundRef", sessionId: "session-1", roundNumber: 4 });
    expect(openCall[1]).toEqual({
      state: "open",
      startedAt: { _type: "serverTimestamp" },
    });

    // Update session activeRoundNumber
    const sessionCall = mockUpdate.mock.calls[2] as unknown[];
    expect(sessionCall[0]).toEqual({ _type: "sessionRef", sessionId: "session-1" });
    expect(sessionCall[1]).toEqual({ activeRoundNumber: 4 });
  });

  it("only closes the current round when at max rounds", async () => {
    const result = await advanceRound({
      sessionId: "session-2",
      currentRoundNumber: 10,
      maxRounds: 10,
    });

    expect(result).toEqual({ hasNextRound: false });

    expect(mockUpdate).toHaveBeenCalledTimes(1);

    const closeCall = mockUpdate.mock.calls[0] as unknown[];
    expect(closeCall[0]).toEqual({ _type: "roundRef", sessionId: "session-2", roundNumber: 10 });
    expect(closeCall[1]).toEqual({
      state: "closed",
      closedAt: { _type: "serverTimestamp" },
    });
  });

  it("commits the batch exactly once", async () => {
    await advanceRound({
      sessionId: "session-3",
      currentRoundNumber: 1,
      maxRounds: 5,
    });

    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});
