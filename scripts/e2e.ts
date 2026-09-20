#!/usr/bin/env bun
/**
 * Runs the e2e suite against a Convex preview deployment this run creates.
 *
 * The provisioning is `preview.ts`, shared with `serve.ts`. It cannot live in
 * Playwright's `globalSetup`: the config needs `baseURL` and
 * `webServer.command` at load time, and both depend on the preview URL and the
 * port chosen here. Invoked as `mise run test:e2e`, and directly by `ci.yml`,
 * which has no mise.
 */
import { $ } from "bun";

import { freePort, provision } from "./preview";

const { siteUrl, testSecret } = await provision();
const port = await freePort();

// Playwright directly, not through a package script: this script is the one
// entry point. Arguments after the script name are forwarded, so `--ui` and
// `--retries 0` reach Playwright.
await $`bunx playwright test ${process.argv.slice(2)}`.env({
  ...process.env,
  TEST_SECRET: testSecret,
  CONVEX_SITE_URL: siteUrl,
  E2E_PORT: String(port),
});
