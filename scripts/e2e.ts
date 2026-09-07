#!/usr/bin/env bun
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Runs the e2e suite against a Convex preview deployment this script creates.
 *
 * The suite reads no `.env.local`. The deployment is made here, the secrets are
 * minted here, and both reach Playwright as environment for one command. That
 * is what lets a fresh checkout, an agent worktree and CI run the same thing
 * without anybody copying an env file around.
 *
 * It cannot live in Playwright's `globalSetup`: the config needs `baseURL` and
 * `webServer.command` at load time, and both depend on the preview URL and the
 * port chosen below. Invoked as `mise run e2e`, and directly by `ci.yml`, which
 * has no mise.
 */
import { $ } from "bun";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

if (!process.env.CONVEX_DEPLOY_KEY) {
  console.error(
    "CONVEX_DEPLOY_KEY is empty, so there is no backend to test against.\n" +
      "Mint a preview deploy key in the Convex dashboard (project settings) and\n" +
      "export it. It can only create preview deployments and set env vars on\n" +
      "them; it cannot reach prod or anyone's dev deployment.\n" +
      "Dependabot reads its own secrets store; add the key there too.\n" +
      "Fork PRs get no secrets at all; re-run the change from a branch in this repo.",
  );
  process.exit(1);
}

// Named for the branch, so two checkouts never share a backend. Convex replaces
// a deployment of the same name, so re-running a branch reuses its own and
// nobody else's, and expires previews itself after five days. CI overrides the
// name with pr-<n>, mg-<sha> or main.
// A detached checkout has no branch name — `--abbrev-ref` prints the literal
// "HEAD" — so fall back to the commit, or every detached checkout on a machine
// would share one deployment.
const ref = (await $`git rev-parse --abbrev-ref HEAD`.text()).trim();
const label = ref === "HEAD" ? (await $`git rev-parse --short HEAD`.text()).trim() : ref;
const preview =
  process.env.PREVIEW_NAME ?? label.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");

// Minted per run and never written down.
const testSecret = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex");
const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
// The format @convex-dev/auth expects: PKCS8 with newlines flattened to spaces.
const jwtPrivateKey = (await exportPKCS8(privateKey)).trimEnd().replace(/\n/g, " ");
const jwks = JSON.stringify({ keys: [{ use: "sig", ...(await exportJWK(publicKey)) }] });

// A free port, so a run collides with neither a dev server nor another checkout.
const port = await new Promise<number>((resolve, reject) => {
  const probe = createServer();
  probe.once("error", reject);
  probe.listen(0, "127.0.0.1", () => {
    const address = probe.address();
    const chosen = typeof address === "object" && address ? address.port : 0;
    probe.close(() => resolve(chosen));
  });
});

const work = await mkdtemp(join(tmpdir(), "woty-e2e-"));
try {
  // The deploy hands the new deployment's URL to the build, which bakes it into
  // the bundle Playwright serves. `--cmd` runs in a child process, so the URL
  // has to come back out through a file. Only the cloud URL is exposed, so the
  // site origin the test helpers POST to is derived from it.
  const urlFile = join(work, "url");
  await $`bunx convex deploy --preview-create ${preview} \
    --cmd ${`printf %s "$VITE_CONVEX_URL" > ${urlFile} && bun run build`} \
    --cmd-url-env-var-name VITE_CONVEX_URL`;
  const cloudUrl = (await readFile(urlFile, "utf8")).trim();

  // After the deploy, not before: --preview-create is what creates the
  // deployment. Setting TEST_SECRET re-analyses the modules, which is what
  // registers the /test/* routes convex/http.ts gates on it.
  await $`bunx convex env set TEST_SECRET ${testSecret} --preview-name ${preview}`;
  await $`bunx convex env set OPTIONS_FIXTURES 1 --preview-name ${preview}`;
  await $`bunx convex env set JWKS ${jwks} --preview-name ${preview}`;
  // Through stdin, not as an argument: the PKCS8 value starts with "-----BEGIN",
  // which the CLI's argument parser reads as a flag.
  await $`bunx convex env set JWT_PRIVATE_KEY --preview-name ${preview} < ${new Response(jwtPrivateKey)}`;

  // Playwright directly, not `bun run test:web`: that script is this script.
  // Arguments after the script name are forwarded, so `--ui` and `--retries 0`
  // reach Playwright through the one supported entry point.
  await $`bunx playwright test ${process.argv.slice(2)}`.env({
    ...process.env,
    TEST_SECRET: testSecret,
    CONVEX_SITE_URL: cloudUrl.replace(/\.cloud$/, ".site"),
    E2E_PORT: String(port),
  });
} finally {
  await rm(work, { recursive: true, force: true });
}
