## E2E Multiplayer Testing Strategy

Test multi-device interactions in a multiplayer game using Maestro on iOS/Android with Convex-scripted players.

### Approach: Maestro + Convex Test Helpers

Maestro drives the real device UI for one player (the host). Other players are simulated by calling Convex HTTP endpoints that directly insert players, selections, etc. into the database — bypassing auth since they're test-only internal mutations.

This gives us:

- Real native e2e on iOS and Android
- Multiplayer state verification via Convex's real-time subscriptions
- Single toolchain, no extra simulators needed

### Architecture

```
convex/test/
├── seed.ts    # Internal mutations: addPlayer, makeSelection, cleanup
└── http.ts    # HTTP action wrappers (POST /test/add-player, etc.)

.maestro/
├── config.yaml                     # Global config + env (CONVEX_SITE_URL)
├── scripts/
│   ├── add-player.js               # Calls /test/add-player
│   ├── make-selection.js           # Calls /test/make-selection
│   └── cleanup.js                  # Calls /test/cleanup
├── smoke/
│   ├── home-screen.yaml            # Home renders
│   ├── select-topic-and-year.yaml  # Picker + navigation
│   ├── setup-screen.yaml           # Setup renders
│   └── round-screen.yaml           # Round renders
└── e2e/
    ├── full-single-player-flow.yaml    # Home → lobby → round
    ├── round-edit-selection.yaml       # Make + edit a selection
    ├── platform-picker.yaml            # Picker swipe behavior
    ├── keyboard-avoidance.yaml         # Keyboard doesn't hide input
    ├── multiplayer-lobby.yaml          # Scripted players join, count updates
    ├── multiplayer-round.yaml          # Both players select → auto-advance
    └── multiplayer-results.yaml        # Multiple rounds, point aggregation
```

### Test Coverage

**Single-player flows (pure Maestro):**

- Home → select topic/year → navigate to setup
- Setup → enter name, pick avatar, create session → land in lobby
- Lobby → start session → round screen
- Round → search, select, edit selection
- Picker swipe behavior (platform-specific)
- Keyboard avoidance on round screen

**Multiplayer flows (Maestro + Convex scripting):**

- Lobby: create session, script adds players, assert player list updates in real-time
- Round progression: host + bot select → round auto-advances
- Results: multiple rounds with overlapping picks, verify ranking/points

### Running Tests

```bash
# Set the Convex site URL (swap .cloud → .site from your EXPO_PUBLIC_CONVEX_URL)
export CONVEX_SITE_URL=https://your-deployment.convex.site

# Regenerate Convex types
bun convex dev

# Run all tests
maestro test .maestro/

# Run by tag
maestro test --tags=smoke .maestro/
maestro test --tags=e2e .maestro/
maestro test --tags=multiplayer .maestro/

# Run a single test
maestro test .maestro/e2e/multiplayer-lobby.yaml
```

### Production Safety

The test HTTP routes (`/test/*`) are gated behind the `IS_TEST` environment variable. Each HTTP action checks `process.env.IS_TEST === "true"` at runtime and returns a 404 if it's not set.

- **Dev deployment:** Set `IS_TEST=true` via the Convex dashboard or `bun convex env set IS_TEST true`
- **Production deployment:** Don't set `IS_TEST` — test routes return 404
