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

## 2. Implement Leave Session Functionality

Add ability for players to leave a session and clean up properly.

**Current Gap:**

- `joinSession` increments `playerCount` when joining
- No corresponding `leaveSession` to decrement and cleanup
- `usePlayers` subscription would handle UI updates, but backend cleanup is missing

**Implementation Requirements:**

1. **Create `src/db/leave-session.ts`:**
   - Transaction to delete player document
   - Decrement `session.playerCount` by 1
   - Handle host leaving scenarios (reassign or close session)

2. **Host Leaving Logic:**
   - If host leaves while `session.isOpen = true` (lobby):
     - Option A: Reassign host to first remaining player
     - Option B: Close/delete the session entirely
   - If host leaves during active game:
     - Keep session alive, reassign host for game control

3. **UI Updates Needed:**
   - Add "Leave" button in lobby screen
   - Handle navigation after leaving (back to home?)
   - Show notification if host leaves/session closes

4. **Edge Cases to Handle:**
   - Last player leaving → cleanup entire session?
   - Player leaving during active round → keep their selections?
   - Disconnection vs explicit leaving (Firebase `onDisconnect()` API?)

5. **Testing:**
   - Create `src/db/__tests__/leave-session.test.ts`
   - Test playerCount decrement
   - Test host reassignment
   - Test full session cleanup when last player leaves

## 3. theme set on player join

## 4. refactor expensive query calls

## 5. games query - how much to fetch

## 6. security

## 7. round flow
