// Mints an ephemeral RS256 keypair for a single e2e run, in the same format
// @convex-dev/auth expects (PKCS8 with spaces for JWT_PRIVATE_KEY, JWKS JSON).
// Writes jwt-private-key.txt and jwks.json into KEYS_DIR (default /tmp).
// KEYS_DIR exists so two runs on one machine cannot clobber each other's keys.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.env.KEYS_DIR ?? "/tmp";

import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
const pkcs8 = (await exportPKCS8(privateKey)).trimEnd().replace(/\n/g, " ");
const jwk = await exportJWK(publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...jwk }] });

writeFileSync(join(dir, "jwt-private-key.txt"), pkcs8);
writeFileSync(join(dir, "jwks.json"), jwks);
