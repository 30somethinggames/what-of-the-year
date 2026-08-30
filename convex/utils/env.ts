/**
 * Deployment-level switches. Convex evaluates module-level `process.env` reads
 * at deploy time only, so `IS_PROD` must be set on the prod deployment before
 * the deploy that carries this code (see README "Production deployment").
 */

/** True on the prod deployment. Presence-only: any non-empty value counts. */
export function isProd(): boolean {
  return !!process.env.IS_PROD;
}

/** Serve deterministic option fixtures instead of calling third-party APIs. Never on prod. */
export function useFixtures(): boolean {
  return !!process.env.OPTIONS_FIXTURES && !isProd();
}

/** Expose the `/test/*` seeding routes. Never on prod. */
export function testRoutesEnabled(): boolean {
  return !!process.env.TEST_SECRET && !isProd();
}

/**
 * Constant-time string comparison for secrets. Runs in the default Convex
 * runtime (no `node:crypto`). Length mismatch short-circuits; the secret is
 * fixed-length so that leaks nothing useful.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bytesA = encoder.encode(a);
  const bytesB = encoder.encode(b);
  if (bytesA.length !== bytesB.length) return false;

  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) {
    diff |= bytesA[i]! ^ bytesB[i]!;
  }
  return diff === 0;
}
