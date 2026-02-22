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
  updateDoc: () => Promise.resolve(),
  writeBatch: () => ({ update: mockUpdate, commit: mockCommit }),
  serverTimestamp: () => ({ _type: "serverTimestamp" }),
  Timestamp: { fromMillis: (ms: number) => ({ _type: "timestamp", ms }) },
  doc: (...segments: string[]) => ({ path: segments.join("/") }),
  collection: (...segments: string[]) => ({ path: segments.join("/") }),
  runTransaction: () => Promise.resolve(),
  increment: (n: number) => ({ _type: "increment", value: n }),
}));

const { startSession } = await import("../utils/start-session");

describe("startSession", () => {
  afterEach(() => {
    mockUpdate.mockClear();
    mockCommit.mockClear();
  });

  it("closes the lobby by setting isOpen to false and setting starting round", async () => {
    await startSession({ sessionId: "session-1" });

    const sessionCall = mockUpdate.mock.calls[0] as unknown[];
    expect(sessionCall[0]).toEqual({ _type: "sessionRef", sessionId: "session-1" });
    expect(sessionCall[1]).toEqual({ isOpen: false, activeRoundNumber: 10 });
  });

  it("opens round 10", async () => {
    await startSession({ sessionId: "session-1" });

    const roundCall = mockUpdate.mock.calls[1] as unknown[];
    expect(roundCall[0]).toEqual({ _type: "roundRef", sessionId: "session-1", roundNumber: 10 });
    expect(roundCall[1]).toEqual({
      state: "open",
      startedAt: { _type: "serverTimestamp" },
    });
  });

  it("calls update exactly twice (session + round)", async () => {
    await startSession({ sessionId: "session-2" });

    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("commits the batch exactly once", async () => {
    await startSession({ sessionId: "session-3" });

    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});
