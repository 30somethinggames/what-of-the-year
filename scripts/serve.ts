#!/usr/bin/env bun
/**
 * Serves the built app against this branch's own preview deployment, for
 * looking at a change by hand or recording it for a PR (`docs/verify.md`).
 *
 * Same provisioning as the e2e suite, then `vite preview` on a free port. The
 * built bundle rather than the dev server, for the same reason the suite uses
 * it: the backend URL is baked in at build time by the deploy that created the
 * preview, so a dev server reading `.env.local` would talk to a different
 * deployment. Stays up until killed. Invoked as `mise run serve`.
 */
import { freePort, provision } from "./preview";

const { name, cloudUrl, siteUrl, testSecret } = await provision();
const port = await freePort();

// No signal forwarding: a terminal's Ctrl-C and the pipeline's kill both go
// to the whole process group, so vite goes down with this script either way.
const preview = Bun.spawn(["bun", "run", "preview", "--port", String(port), "--strictPort"], {
  stdout: "inherit",
  stderr: "inherit",
});

// Print the URL only once it answers, so a reader (or an agent) can go
// straight there.
const url = `http://localhost:${port}`;
for (let attempt = 0; attempt < 100; attempt++) {
  if (preview.exitCode !== null) break;
  try {
    if ((await fetch(url)).ok) break;
  } catch {
    // not up yet
  }
  await Bun.sleep(100);
}

// The seeding routes and their secret, so a phase can be seeded rather than
// clicked through. Both are this run's and die with the preview, which Convex
// expires in five days.
console.log(`URL=${url}`);
console.log(`preview=${name}`);
console.log(`CONVEX_URL=${cloudUrl}`);
console.log(`CONVEX_SITE_URL=${siteUrl}`);
console.log(`TEST_SECRET=${testSecret}`);

process.exit(await preview.exited);
