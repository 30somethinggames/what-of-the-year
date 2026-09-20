/**
 * Creates a Convex preview deployment for this checkout and builds the bundle
 * against it.
 *
 * Nothing here is taken from `.env.local`. The deployment is made here and the
 * secrets are minted here, and both are returned for the caller to pass to one
 * command, so every checkout runs the same thing without anybody copying an env
 * file around. The one exception is `CONVEX_DEPLOY_KEY`, which cannot be minted
 * here — bun loads it from `.env.local`.
 *
 * Two callers: `scripts/e2e.ts` runs Playwright against the build, and
 * `scripts/serve.ts` serves it for an agent to drive.
 */
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "bun";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

export type Provisioned = {
  /** The deployment's name, `--preview-name` for any further `convex` call. */
  preview: string;
  /** Minted for this run; authorises the `/test/*` routes `convex/http.ts` gates. */
  testSecret: string;
  /** The deployment's `.cloud` URL, baked into the build. */
  cloudUrl: string;
  /** The same deployment's `.site` origin, which the test helpers POST to. */
  siteUrl: string;
  /** A free port, for whoever serves the build. */
  port: number;
};

/** Creates the deployment, mints its secrets, builds against it. */
export async function provision(): Promise<Provisioned> {
  if (!process.env.CONVEX_DEPLOY_KEY) {
    console.error(
      "CONVEX_DEPLOY_KEY is empty, so there is no backend to provision.\n" +
        "Mint a preview deploy key in the Convex dashboard (project settings) and\n" +
        "put it in .env.local — bun loads that file, so nothing needs exporting.\n" +
        "It can only create preview deployments and set env vars on them; it\n" +
        "cannot reach prod or anyone's dev deployment.\n" +
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

  const work = await mkdtemp(join(tmpdir(), "woty-preview-"));
  try {
    // The deploy hands the new deployment's URL to the build, which bakes it into
    // the bundle. `--cmd` runs in a child process, so the URL has to come back
    // out through a file. Only the cloud URL is exposed, so the site origin the
    // test helpers POST to is derived from it.
    const urlFile = join(work, "url");
    await $`bunx convex deploy --preview-create ${preview} \
      --cmd ${`printf %s "$VITE_CONVEX_URL" > ${urlFile} && bun run build`} \
      --cmd-url-env-var-name VITE_CONVEX_URL`;
    const cloudUrl = (await readFile(urlFile, "utf8")).trim();

    // The deploy just regenerated convex/_generated. Checking here, rather than
    // after the suite, means a stale tree costs one deploy instead of a deploy
    // plus the whole suite — and it still gets reported when a test fails, which
    // it would not if the check ran last. `git status --porcelain` rather than
    // `git diff` so a file the CLI newly emits counts too.
    const drift = (await $`git status --porcelain -- convex/_generated`.text()).trim();
    if (drift) {
      await $`git diff -- convex/_generated`.nothrow();
      console.error(
        `${process.env.GITHUB_ACTIONS ? "::error::" : ""}convex/_generated is stale. The deploy ` +
          "regenerated it into something other than what is committed:\n" +
          drift +
          "\nRun `bunx convex dev --once`, or `bunx convex codegen` against a deployment, and " +
          "commit convex/_generated.",
      );
      throw new Error("convex/_generated is stale");
    }

    // After the deploy, not before: --preview-create is what creates the
    // deployment. Setting TEST_SECRET re-analyses the modules, which is what
    // registers the /test/* routes convex/http.ts gates on it.
    await $`bunx convex env set TEST_SECRET ${testSecret} --preview-name ${preview}`;
    await $`bunx convex env set OPTIONS_FIXTURES 1 --preview-name ${preview}`;
    await $`bunx convex env set JWKS ${jwks} --preview-name ${preview}`;
    // Through stdin, not as an argument: the PKCS8 value starts with "-----BEGIN",
    // which the CLI's argument parser reads as a flag.
    await $`bunx convex env set JWT_PRIVATE_KEY --preview-name ${preview} < ${new Response(jwtPrivateKey)}`;

    return {
      preview,
      testSecret,
      cloudUrl,
      siteUrl: cloudUrl.replace(/\.cloud$/, ".site"),
      port,
    };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
