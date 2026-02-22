import { afterEach, describe, expect, it, mock } from "bun:test";

const mockGet = mock(() => Promise.resolve({ exists: () => false as boolean }));
const mockSet = mock(() => {});
const mockTransactionUpdate = mock(() => {});

mock.module("db/config", () => ({
  db: {},
}));

mock.module("db/collections", () => ({
  sessionsRef: () => ({ path: "sessions" }),
  sessionRef: (sessionId: string) => ({ _type: "sessionRef", sessionId }),
  playersRef: (sessionId: string) => ({ path: `sessions/${sessionId}/players` }),
  playerRef: (sessionId: string, uid: string) => ({
    path: `sessions/${sessionId}/players/${uid}`,
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
    _type: "selectionRef",
    sessionId,
    roundNumber,
    uid,
  }),
}));

mock.module("firebase/firestore", () => ({
  runTransaction: (_db: unknown, fn: (t: unknown) => Promise<void>) =>
    fn({ get: mockGet, set: mockSet, update: mockTransactionUpdate }),
  serverTimestamp: () => ({ _type: "serverTimestamp" }),
  Timestamp: { fromMillis: (ms: number) => ({ _type: "timestamp", ms }) },
  doc: (...segments: string[]) => ({ path: segments.join("/") }),
  collection: (...segments: string[]) => ({ path: segments.join("/") }),
  writeBatch: () => ({}),
  increment: (n: number) => ({ _type: "increment", value: n }),
}));

const { saveSelection } = await import("../utils/save-selection");

describe("saveSelection", () => {
  afterEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockTransactionUpdate.mockClear();
    // Reset to default (no existing selection)
    mockGet.mockImplementation(() => Promise.resolve({ exists: () => false }));
  });

  it("writes selection doc with pick, points, and timestamp", async () => {
    await saveSelection({
      sessionId: "session-1",
      roundNumber: 10,
      uid: "user-1",
      name: "Elden Ring",
    });

    expect(mockSet).toHaveBeenCalledTimes(1);

    const setCall = mockSet.mock.calls[0] as unknown[];
    expect(setCall[0]).toEqual({
      _type: "selectionRef",
      sessionId: "session-1",
      roundNumber: 10,
      uid: "user-1",
    });

    const data = setCall[1] as Record<string, unknown>;
    expect(data.pick).toEqual({ id: "elden-ring", name: "Elden Ring" });
    expect(data.points).toBe(1); // round 10 = weight 1
    expect(data.savedAt).toEqual({ _type: "serverTimestamp" });
  });

  it("computes points from round weight (round 1 = 10pts)", async () => {
    await saveSelection({
      sessionId: "session-1",
      roundNumber: 1,
      uid: "user-1",
      name: "The Last of Us",
    });

    const setCall = mockSet.mock.calls[0] as unknown[];
    const data = setCall[1] as Record<string, unknown>;
    expect(data.points).toBe(10);
  });

  it("increments selectionsComplete on the round doc", async () => {
    await saveSelection({
      sessionId: "session-1",
      roundNumber: 5,
      uid: "user-1",
      name: "Hades",
    });

    expect(mockTransactionUpdate).toHaveBeenCalledTimes(1);

    const updateCall = mockTransactionUpdate.mock.calls[0] as unknown[];
    expect(updateCall[0]).toEqual({
      _type: "roundRef",
      sessionId: "session-1",
      roundNumber: 5,
    });
    expect(updateCall[1]).toEqual({
      selectionsComplete: { _type: "increment", value: 1 },
    });
  });

  it("checks for existing selection before writing", async () => {
    await saveSelection({
      sessionId: "session-1",
      roundNumber: 3,
      uid: "user-1",
      name: "Baldur's Gate 3",
    });

    expect(mockGet).toHaveBeenCalledTimes(1);

    const getCall = mockGet.mock.calls[0] as unknown[];
    expect(getCall[0]).toEqual({
      _type: "selectionRef",
      sessionId: "session-1",
      roundNumber: 3,
      uid: "user-1",
    });
  });

  it("throws if selection already exists", async () => {
    mockGet.mockImplementation(() => Promise.resolve({ exists: () => true }));

    await expect(
      saveSelection({
        sessionId: "session-1",
        roundNumber: 3,
        uid: "user-1",
        name: "Duplicate Pick",
      }),
    ).rejects.toThrow("Selection already exists for this round");

    // Should not write anything
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });
});
