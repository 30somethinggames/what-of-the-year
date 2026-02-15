# TODOs

## 1. E2E Multiplayer Testing Strategy

Figure out how to test multi-device interactions in a multiplayer game.

**Critical Flows to Test:**

- Host starts game → all players auto-navigate to round 1
- Host advances round → all players see new round
- Player makes selection → other players see completion status
- Multiple players join lobby → all see updates

**Approach Options:**

#### Option A: Mock Multiple Clients (Recommended for MVP)

- Spin up multiple Firebase instances in test
- Simulate host + 2-3 player clients
- Test state propagation through Firestore
- **Pros:** No external dependencies, fast, reliable
- **Cons:** Not testing real multi-device scenarios

#### Option B: Playwright/Maestro with Multiple Sessions

- Open multiple browser tabs/sessions (web)
- Or multiple simulator instances (mobile)
- Coordinate actions across sessions
- **Pros:** Real multi-device testing
- **Cons:** Slow, complex setup, flaky

#### Option C: Firestore Emulator + Test Bots (Best Balance)

- Run tests against Firebase emulator
- Create test "bot" utilities that simulate player actions
- Verify state changes propagate correctly
- **Pros:** Fast, reliable, good balance of real + testable
- **Cons:** Requires emulator setup

**Decision:** Start with **Option A or C** - fastest/most reliable for initial coverage. Add Option B for critical flows only if needed.

**Next Steps:**

- Draft testing utilities for simulating multiple clients
- Identify 3-5 critical multiplayer flows to cover
- Decide on tooling (Jest + mocked Firestore vs Emulator)

---

## 2. Deeplinks

Figure out [deeplinks](./universal-links.md)

---

## 3. theme set on player join

## 4. refactor expensive query calls

## 5. games query - how much to fetch

## 6. security

## 7. round flow
