// Mints an ephemeral RS256 keypair for a single e2e run, in the two formats
// @convex-dev/auth expects: PKCS8 with newlines flattened to spaces for
// JWT_PRIVATE_KEY, and a JWKS document for JWKS.
//
// Prints them as JSON on stdout. Nothing is written to disk: the caller is a
// shell script one line away, and files meant two runs on one machine could
// overwrite each other's keys.
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });

console.log(
  JSON.stringify({
    privateKey: (await exportPKCS8(privateKey)).trimEnd().replace(/\n/g, " "),
    jwks: JSON.stringify({ keys: [{ use: "sig", ...(await exportJWK(publicKey)) }] }),
  }),
);
