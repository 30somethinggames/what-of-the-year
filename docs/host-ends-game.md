# Host Ends Game

Research into how multiplayer games/apps handle the "host leaves or ends the game" scenario, and recommendations for our implementation.

## How Other Apps Handle It

### Jackbox Games
- Host device is the "screen" — if it disconnects, the game is over immediately
- Players see a "Disconnected" screen with no recovery option
- No warning or countdown — it's instant

### Kahoot
- If the host ends the quiz, all players see a "Game Over" screen
- Players are shown final standings before being returned to the home screen
- No option to continue without the host

### Among Us
- If the host leaves, host is silently migrated to another player
- Game continues uninterrupted — players may not even notice
- Only if all players leave does the session end

### Gartic Phone
- Host controls when rounds advance
- If host disconnects, the game pauses and players see a waiting message
- After a timeout, the game ends and players are kicked

### Figma / Google Docs (collaborative, not games)
- No single "host" — anyone can leave without affecting others
- Session persists as long as the document exists
- Last person leaving doesn't destroy the session

## Patterns Summary

| Pattern | Used By | Pros | Cons |
|---------|---------|------|------|
| Instant end | Jackbox | Simple, no ambiguity | Abrupt, poor UX |
| End + results | Kahoot | Clean closure, players see standings | Still abrupt |
| Host migration | Among Us | Seamless, game continues | Complex to implement |
| Pause + timeout | Gartic Phone | Gives host a chance to reconnect | Players left waiting |

## Recommendations

### Approach: End Game + Notify (Kahoot-style)

This fits our app best — we have a clear host role and short game sessions. Host migration (V2 backlog item) can come later.

### Implementation Plan

1. **Add `status` field to sessions**: `"lobby" | "active" | "ended"`
   - Currently session deletion is the signal, but that removes data before clients can react
   - Instead of deleting, set `status: "ended"` so the session record persists briefly

2. **Leverage Convex reactive subscriptions**
   - Clients already subscribe to session data via `useQuery`
   - When `status` flips to `"ended"`, the client gets notified automatically — no polling needed
   - This is the cleanest path given our stack

3. **Client-side behavior when `status === "ended"`**
   - Show a modal/toast: "The host ended the game"
   - Auto-redirect to home after a short delay (2-3 seconds), or immediately on dismiss
   - Prevents the current behavior where players see `<Error />` when the session disappears

4. **Host "End Game" action**
   - The host's "End Game" button (already exists in settings as the last-round advance) sets `status: "ended"` instead of deleting
   - Host is navigated home immediately
   - Optional: scheduled function to clean up ended sessions after N minutes

5. **Host disconnects / leaves mid-game**
   - `leaveSession` for the host should also set `status: "ended"`
   - Same notification flow for remaining players

### What This Doesn't Cover (V2)

- **Host handoff** — transfer host role to another player instead of ending (already in todos.md V2)
- **Reconnection** — host rejoining after disconnect
- **Vote to end** — letting players vote on whether to continue
