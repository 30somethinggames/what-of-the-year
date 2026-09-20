#!/usr/bin/env bun
/**
 * Serves the built app against a Convex preview deployment this run creates,
 * for an agent to drive in a browser. `docs/verify.md` is the recipe.
 *
 * The deployment, its secrets and the build are `scripts/provision.ts`, the
 * same ones `mise run test:e2e` gets, so what is served talks to the branch's
 * own backend and never to a dev deployment.
 */
import { preview } from "vite";

import { provision } from "./provision";

const { port } = await provision();

// Vite's own API rather than `bun run preview`: it resolves once the server is
// listening, so the URL below is live when it is printed, and the process stays
// up until it is killed with nothing to supervise.
// strictPort: vite otherwise serves on port+1 when the probed port was taken in
// between, and the URL printed here would point at nothing.
await preview({ preview: { port, strictPort: true } });

console.log(`URL=http://localhost:${port}`);
