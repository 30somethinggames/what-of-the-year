## Testing Strategy

### Unit Tests

```bash
bun test          # run once
bun test --watch  # watch mode
```

### Smoke Tests

Quick sanity check that screens render and key elements are visible. No backend interaction beyond creating a session.

```bash
bun run test:smoke
```

**Covers:** Home → Setup → Lobby → Round → Settings (assertVisible checks only)

### E2E Tests

Full game flows on a real simulator. Multiplayer players are simulated via Convex HTTP test endpoints.

```bash
bun run test:e2e
```

**Single Player** (`single-player.yaml`): Home → Setup → Lobby → 10 rounds with autocomplete → edit pick → results with points

**Multiplayer Host** (`multiplayer/host.yaml`): Host creates game, API adds 2 players, 3 rounds of mixed picks, host advances remaining rounds via settings, end game, results with rankings

### Architecture

```
convex/test/
├── seed.ts    # Internal mutations: addPlayer, makeSelection, cleanup
└── http.ts    # HTTP action wrappers (POST /test/add-player, etc.)

.maestro/
├── scripts/
│   ├── add-player.js         # Calls /test/add-player
│   ├── make-selection.js     # Calls /test/make-selection
│   └── cleanup.js            # Calls /test/cleanup
├── smoke/
│   └── smoke.yaml            # Full smoke flow
└── e2e/
    ├── single-player.yaml
    └── multiplayer/
        └── host.yaml
```

### Multiplayer Testing Approach

Maestro drives the real device UI for one player (the host). Other players are simulated by calling Convex HTTP endpoints that insert players and selections into the database — bypassing auth via test-only internal mutations.

This gives us:

- Real native e2e on iOS and Android
- Multiplayer state verification via Convex's real-time subscriptions
- Single device, no extra simulators needed

Scripts reference `MAESTRO_CONVEX_SITE_URL` which is set inline in the `test:e2e` script.

### Production Safety

Test HTTP routes (`/test/*`) are gated behind the `IS_TEST` environment variable. Each HTTP action checks `process.env.IS_TEST === "true"` at runtime and returns 404 if not set.

- **Dev:** `bunx convex env set IS_TEST true`
- **Prod:** Don't set `IS_TEST` — test routes return 404
