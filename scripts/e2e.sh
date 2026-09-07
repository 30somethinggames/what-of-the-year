#!/usr/bin/env bash
# Runs the e2e suite against a Convex preview deployment this script creates.
#
# The suite reads no `.env.local`: the deployment is made here, the secrets are
# minted here, and both are handed to Playwright as environment for one command.
# That is what lets a fresh checkout, an agent worktree and CI all run the same
# thing without anybody copying an env file around.
#
# Invoked as `mise run e2e`, and directly by ci.yml — CI has no mise, and the
# repo's allowed-actions policy does not include one, so the logic lives in a
# file both can call rather than inside mise.toml.
set -euo pipefail
: "${CONVEX_DEPLOY_KEY:?no Convex preview deploy key. Mint one in the Convex dashboard (project settings) and export CONVEX_DEPLOY_KEY.}"

# Named for the branch, so two checkouts never share a backend. --preview-create
# replaces a deployment of the same name, so re-running a branch reuses its own
# and nobody else's; Convex expires previews itself after five days. CI
# overrides the name: pr-<n>, mg-<sha>, main.
NAME="${PREVIEW_NAME:-$(git rev-parse --abbrev-ref HEAD | tr -cs 'a-zA-Z0-9' '-' | sed 's/-*$//')}"

# Minted per run and never written down: the secret and the keypair live in
# this shell for the length of the run and go when it exits.
TEST_SECRET="$(openssl rand -hex 32)"
export TEST_SECRET
KEYS="$(bun scripts/generate-test-keys.mjs)"

# The one thing that does need a file: --cmd runs in a child process, so the
# URL it is given has to come back out through the filesystem.
URL_FILE="$(mktemp)"
trap 'rm -f "$URL_FILE"' EXIT

# The deploy hands the new deployment's URL to the build, which bakes it into
# the bundle Playwright serves. Only the cloud URL is exposed, so the site
# origin the test helpers POST to is derived from it.
bunx convex deploy --preview-create "$NAME" \
  --cmd "printf %s \"\$VITE_CONVEX_URL\" > $URL_FILE && bun run build" \
  --cmd-url-env-var-name VITE_CONVEX_URL
CLOUD_URL="$(cat "$URL_FILE")"
export CONVEX_SITE_URL="${CLOUD_URL%.cloud}.site"

# After the deploy, not before: --preview-create is what creates the deployment.
# Setting TEST_SECRET re-analyses the modules, which is what registers the
# /test/* routes convex/http.ts gates on it.
bunx convex env set TEST_SECRET "$TEST_SECRET" --preview-name "$NAME"
bunx convex env set OPTIONS_FIXTURES 1 --preview-name "$NAME"
# Piped, not passed: the PKCS8 value starts with "-----BEGIN", which the CLI's
# argument parser reads as a flag.
jq -r .privateKey <<<"$KEYS" | bunx convex env set JWT_PRIVATE_KEY --preview-name "$NAME"
bunx convex env set JWKS "$(jq -r .jwks <<<"$KEYS")" --preview-name "$NAME"

# A free port, so a run collides with neither a dev server nor another checkout.
E2E_PORT="$(bun -e 'import net from "node:net"; const s = net.createServer(); s.listen(0, "127.0.0.1", () => { console.log(s.address().port); s.close(); });')"
export E2E_PORT
bun run test:web
