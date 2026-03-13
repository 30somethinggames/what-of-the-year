# E2E Non-Host Testing Strategy

## Current Architecture

The existing E2E pattern is: **Maestro device = host, API = simulated players**

- `add-player.js` → inserts player docs server-side (no UI)
- `make-selection.js` → inserts selections server-side
- Maestro drives the host's UI on the single real device

## The Problem

Testing non-host behavior requires observing what a **non-host player sees** in the UI — but API players have no UI. Neither of these is testable with the current setup:

1. Non-host taps "Leave Game" → returns to home screen
2. Host ends game → non-host sees "host ended the game" alert

## Solution: Flip the Device Role

Run new test flows where **Maestro device = non-host** and **API = simulated host**. This fits the existing pattern exactly, just reversed.

### New Test Endpoints Needed (`convex/test/`)

| Endpoint | Purpose |
|---|---|
| `POST /test/create-session` | Creates a session with an API host player, returns `sessionId` + host `uid` |
| `POST /test/start-session` | Starts the session (bypasses host check) |
| `POST /test/end-session` | Ends the session (bypasses host check) |

### New Maestro Flows

**`non-host-leave.yaml`**
1. API creates session + host → get `sessionId`
2. Maestro device joins session (via deep link or session code UI)
3. API starts session
4. Maestro device taps "Leave Game"
5. Assert: device is back on home screen

**`non-host-host-ended.yaml`**
1. API creates session + host → get `sessionId`
2. Maestro device joins session
3. API starts session
4. API calls `end-session`
5. Assert: Maestro device sees "host ended the game" alert

## Why It's Hard Today

The current `add-player` → `make-selection` flow is straightforward because the API just writes DB docs — the host device sees them via Convex real-time subscriptions automatically. Flipping the approach requires **new endpoints for host actions** (create, start, end session) that bypass the `isHost` auth check, which is more involved than simply inserting docs.

The existing `host-management.yaml` flow already tests "end game early" from the host's perspective. The gap is purely the **non-host perspective**.
