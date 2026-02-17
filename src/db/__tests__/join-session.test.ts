import { afterEach, describe, expect, it, mock } from "bun:test";

// --- Mock everything BEFORE importing joinSession ---
const mockTransactionGet = mock<
  () => Promise<{ exists: () => boolean; data?: () => Record<string, unknown> }>
>(() =>
  Promise.resolve({
    exists: () => false as boolean,
    data: () => ({}) as Record<string, unknown>,
  }),
);
const mockTransactionSet = mock<(...args: unknown[]) => void>(() => {});
const mockTransactionUpdate = mock<(...args: unknown[]) => void>(() => {});

mock.module("db/config", () => ({
  db: {},
}));

mock.module("db/collections", () => ({
  sessionsRef: () => ({ path: "sessions" }),
  sessionRef: (id: string) => ({ path: `sessions/${id}`, id }),
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
  writeBatch: () => ({
    set: mock(() => {}),
    update: mock(() => {}),
    commit: mock(() => Promise.resolve()),
  }),
  serverTimestamp: () => ({ _type: "serverTimestamp" }),
  Timestamp: { fromMillis: (ms: number) => ({ _type: "timestamp", ms }) },
  doc: (...segments: string[]) => ({ path: segments.join("/") }),
  collection: (...segments: string[]) => ({ path: segments.join("/") }),
  runTransaction: (_db: unknown, fn: (transaction: unknown) => Promise<void>) => {
    return fn({
      get: mockTransactionGet,
      set: mockTransactionSet,
      update: mockTransactionUpdate,
    });
  },
  increment: (n: number) => ({ _type: "increment", value: n }),
}));

const { joinSession } = await import("../utils/join-session");

describe("joinSession", () => {
  afterEach(() => {
    mockTransactionGet.mockClear();
    mockTransactionSet.mockClear();
    mockTransactionUpdate.mockClear();
  });

  it("joins an open session with available spots", async () => {
    mockTransactionGet
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ isOpen: true, playerCount: 3, maxPlayers: 10 }),
      })
      .mockResolvedValueOnce({
        exists: () => false, // player doesn't exist yet
        data: () => ({}),
      });

    const result = await joinSession({
      sessionId: "session-abc",
      uid: "user-456",
      name: "Guest",
      avatar: "avatar-seed",
    });

    expect(result.sessionId).toBe("session-abc");
    expect(mockTransactionSet).toHaveBeenCalledTimes(1);
    expect(mockTransactionUpdate).toHaveBeenCalledTimes(1);
  });

  it("sets player data with isHost=false", async () => {
    mockTransactionGet
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ isOpen: true, playerCount: 1, maxPlayers: 10 }),
      })
      .mockResolvedValueOnce({
        exists: () => false,
        data: () => ({}),
      });

    await joinSession({
      sessionId: "session-abc",
      uid: "user-456",
      name: "Guest",
      avatar: "avatar-seed",
    });

    const playerData = mockTransactionSet.mock.calls[0]![1] as Record<string, unknown>;
    expect(playerData.name).toBe("Guest");
    expect(playerData.avatar).toBe("avatar-seed");
    expect(playerData.isHost).toBe(false);
    expect(playerData.joinedAt).toEqual({ _type: "serverTimestamp" });
  });

  it("increments playerCount by 1", async () => {
    mockTransactionGet
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ isOpen: true, playerCount: 2, maxPlayers: 10 }),
      })
      .mockResolvedValueOnce({
        exists: () => false,
        data: () => ({}),
      });

    await joinSession({
      sessionId: "session-abc",
      uid: "user-456",
      name: "Guest",
      avatar: "avatar-seed",
    });

    const updateData = mockTransactionUpdate.mock.calls[0]![1] as Record<string, unknown>;
    expect(updateData.playerCount).toEqual({ _type: "increment", value: 1 });
  });

  it("throws if session does not exist", async () => {
    mockTransactionGet.mockResolvedValueOnce({
      exists: () => false,
      data: () => ({}),
    });

    expect(
      joinSession({
        sessionId: "nonexistent",
        uid: "user-456",
        name: "Guest",
        avatar: "avatar-seed",
      }),
    ).rejects.toThrow("Session not found");
  });

  it("throws if session is closed", async () => {
    mockTransactionGet.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ isOpen: false, playerCount: 5, maxPlayers: 10 }),
    });

    expect(
      joinSession({
        sessionId: "session-abc",
        uid: "user-456",
        name: "Guest",
        avatar: "avatar-seed",
      }),
    ).rejects.toThrow("Session is closed");
  });

  it("throws if session is full", async () => {
    mockTransactionGet.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ isOpen: true, playerCount: 10, maxPlayers: 10 }),
    });

    expect(
      joinSession({
        sessionId: "session-abc",
        uid: "user-456",
        name: "Guest",
        avatar: "avatar-seed",
      }),
    ).rejects.toThrow("Session is full");
  });

  it("throws if player already joined", async () => {
    mockTransactionGet
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ isOpen: true, playerCount: 3, maxPlayers: 10 }),
      })
      .mockResolvedValueOnce({
        exists: () => true, // player already exists
      });

    expect(
      joinSession({
        sessionId: "session-abc",
        uid: "user-456",
        name: "Guest",
        avatar: "avatar-seed",
      }),
    ).rejects.toThrow("Already joined this session");
  });
});
