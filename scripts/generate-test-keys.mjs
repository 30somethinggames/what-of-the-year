// Mints an ephemeral RS256 keypair for hermetic CI runs, in the same format
// @convex-dev/auth expects (PKCS8 with spaces for JWT_PRIVATE_KEY, JWKS JSON).
// Writes /tmp/jwt-private-key.txt and /tmp/jwks.json.
import { writeFileSync } from "node:fs";

import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
const pkcs8 = (await exportPKCS8(privateKey)).trimEnd().replace(/\n/g, " ");
const jwk = await exportJWK(publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...jwk }] });

writeFileSync("/tmp/jwt-private-key.txt", pkcs8);
writeFileSync("/tmp/jwks.json", jwks);
