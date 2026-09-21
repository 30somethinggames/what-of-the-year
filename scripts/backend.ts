#!/usr/bin/env bun
/**
 * Brings up this checkout's own Convex backend: an anonymous local deployment,
 * a CLI-managed binary with its state under `.convex/`, no account, no key, no
 * cost. A branch's pushes can then never reach the shared cloud dev
 * deployment, and two worktrees run two backends side by side. Invoked as
 * `mise run backend`; `mise run backend:reset` throws the instance away first,
 * which is the way out of a push refused by rows an earlier run left behind.
 *
 * Each checkout gets a port pair derived from its path, so it keeps the same
 * ports across runs and two checkouts never want the same ones. The CLI would
 * otherwise hand every idle checkout 3210 and they would collide the moment two
 * ran at once.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { appendFile, readFile, rm } from "node:fs/promises";
import { connect } from "node:net";

import { $ } from "bun";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const ENV_FILE = ".env.local";
const reset = process.argv.includes("--reset");

// Only consulted while no deployment is configured yet: it is what stops the
// first `convex dev` from asking a logged-in user to pick a cloud project.
// Once .env.local names the anonymous deployment the CLI resolves it from
// there, so nothing else in the repo has to set this.
const env = { ...process.env, CONVEX_AGENT_MODE: "anonymous" };

async function readEnv(key: string): Promise<string> {
  if (!existsSync(ENV_FILE)) return "";
  const lines = (await readFile(ENV_FILE, "utf8")).split("\n");
  const hits = lines.filter((l) => l.startsWith(key + "="));
  const hit = hits[hits.length - 1];
  // The CLI writes a trailing "# team: …" comment after the deployment name.
  return hit
    ? hit
        .slice(key.length + 1)
        .replace(/\s+#.*$/, "")
        .trim()
    : "";
}

// Refuse to touch a file that names a cloud backend through either key: a
// file carrying only VITE_CONVEX_URL still points a client at the cloud.
const deployment = await readEnv("CONVEX_DEPLOYMENT");
const convexUrl = await readEnv("VITE_CONVEX_URL");
const cloud =
  (deployment && !deployment.startsWith("anonymous:") && deployment) ||
  (convexUrl && !/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):/.test(convexUrl) && convexUrl);
if (cloud) {
  console.error(
    `${ENV_FILE} points at ${cloud}, not a local backend. Remove CONVEX_DEPLOYMENT and VITE_CONVEX_URL from it and re-run, or keep using that deployment and skip this.`,
  );
  process.exit(1);
}

if (reset) {
  await rm(".convex", { recursive: true, force: true });
  await rm(ENV_FILE, { force: true });
  console.log("Discarded local backend state.");
}

// Playwright and the seeding helpers need the same secret the deployment
// checks, so it lives in .env.local and outlives the deployment's env var.
const testSecret =
  (await readEnv("TEST_SECRET")) ||
  Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex");

/** Whether nothing is listening on the port. */
function free(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = connect({ port, host: "127.0.0.1" });
    s.once("connect", () => {
      s.destroy();
      resolve(false);
    });
    s.once("error", () => resolve(true));
  });
}

/**
 * The first free block of `width` ports at or after this checkout's slot,
 * scanning on when something else holds a block, which also covers two paths
 * hashing to the same slot.
 */
async function claimPorts(base: number, width: number): Promise<number> {
  const slots = 300;
  const seed = parseInt(createHash("sha1").update(process.cwd()).digest("hex").slice(0, 4), 16);
  for (let i = 0; i < slots; i++) {
    const port = base + width * ((seed + i) % slots);
    let taken = false;
    for (let p = port; p < port + width; p++) if (!(await free(p))) taken = true;
    if (!taken) return port;
  }
  throw new Error(`No free block of ${width} ports from ${base} to ${base + width * slots - 1}.`);
}

// Creates the deployment, downloads the backend binary, pins the port pair
// and writes the URLs to .env.local. Only `convex dev` can do this — `convex
// env` needs a deployment that already exists. Both halves have to be present:
// `.convex/` state without an `.env.local` naming it leaves `convex env` with
// no deployment to talk to.
const configured =
  existsSync(".convex/local/default/config.json") && deployment.startsWith("anonymous:");
if (!configured) {
  const port = await claimPorts(3210, 2);
  await $`bunx convex dev --once --tail-logs disable --local-cloud-port ${port} --local-site-port ${port + 1}`.env(
    env,
  );
}

// The same switches the e2e suite sets on a preview: the seeding routes'
// secret, fixture options instead of live APIs, and an auth keypair.
const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
const jwtPrivateKey = (await exportPKCS8(privateKey)).trimEnd().replace(/\n/g, " ");
const jwks = JSON.stringify({ keys: [{ use: "sig", ...(await exportJWK(publicKey)) }] });
await $`bunx convex env set TEST_SECRET ${testSecret}`.env(env);
await $`bunx convex env set OPTIONS_FIXTURES 1`.env(env);
await $`bunx convex env set JWKS ${jwks}`.env(env);
// Through stdin: the PKCS8 value starts with "-----BEGIN", which the CLI's
// argument parser reads as a flag.
await $`bunx convex env set JWT_PRIVATE_KEY < ${new Response(jwtPrivateKey)}`.env(env);

// Push again with the switches in place: convex/http.ts reads TEST_SECRET at
// module level, so /test/* only registers if the push came after it was set.
await $`bunx convex dev --once --tail-logs disable`.env(env);

// The CLI owns CONVEX_DEPLOYMENT and the URLs in this file; TEST_SECRET is ours.
if (!(await readEnv("TEST_SECRET"))) {
  await appendFile(ENV_FILE, `\nTEST_SECRET=${testSecret}\n`);
}

console.log(`Local backend ready — ${await readEnv("VITE_CONVEX_URL")}`);
