#!/usr/bin/env bun
/**
 * Runs the e2e suite against a Convex preview deployment this run creates.
 *
 * The deployment, its secrets and the build are `scripts/provision.ts`; this
 * script is what Playwright needs on top of them.
 *
 * It cannot live in Playwright's `globalSetup`: the config needs `baseURL` and
 * `webServer.command` at load time, and both depend on the preview URL and the
 * port provisioning chooses. Invoked as `mise run test:e2e`, and directly by
 * `ci.yml`, which has no mise.
 */
import { $ } from "bun";

import { provision } from "./provision";

const { testSecret, siteUrl, port } = await provision();

// Playwright directly, not `mise run test:e2e`: that task is this script.
// Arguments after the script name are forwarded, so `--ui` and `--retries 0`
// reach Playwright through the one supported entry point.
await $`bunx playwright test ${process.argv.slice(2)}`.env({
  ...process.env,
  TEST_SECRET: testSecret,
  CONVEX_SITE_URL: siteUrl,
  E2E_PORT: String(port),
});
