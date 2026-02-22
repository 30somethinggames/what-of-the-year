import { afterEach, describe, expect, it, mock } from "bun:test";

const mockUpdateDoc = mock(() => Promise.resolve());

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
  updateDoc: mockUpdateDoc,
  serverTimestamp: () => ({ _type: "serverTimestamp" }),
  Timestamp: { fromMillis: (ms: number) => ({ _type: "timestamp", ms }) },
  doc: (...segments: string[]) => ({ path: segments.join("/") }),
  collection: (...segments: string[]) => ({ path: segments.join("/") }),
  writeBatch: () => ({}),
  increment: (n: number) => ({ _type: "increment", value: n }),
  runTransaction: () => Promise.resolve(),
}));

const { editSelection } = await import("../utils/edit-selection");

describe("editSelection", () => {
  afterEach(() => {
    mockUpdateDoc.mockClear();
  });

  it("updates selection doc with new pick and timestamp", async () => {
    await editSelection({
      sessionId: "session-1",
      roundNumber: 5,
      uid: "user-1",
      name: "Baldur's Gate 3",
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    const [ref, data] = mockUpdateDoc.mock.calls[0] as unknown as [
      unknown,
      Record<string, unknown>,
    ];
    expect(ref).toEqual({
      _type: "selectionRef",
      sessionId: "session-1",
      roundNumber: 5,
      uid: "user-1",
    });
    expect(data.pick).toEqual({ id: "baldur's-gate-3", name: "Baldur's Gate 3" });
    expect(data.savedAt).toEqual({ _type: "serverTimestamp" });
  });

  it("does not touch selectionsComplete", async () => {
    await editSelection({
      sessionId: "session-1",
      roundNumber: 3,
      uid: "user-1",
      name: "Elden Ring",
    });

    const [, data] = mockUpdateDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    expect(data).not.toHaveProperty("selectionsComplete");
  });
});
