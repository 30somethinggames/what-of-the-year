import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { httpAction } from "../_generated/server";
import { timingSafeEqual } from "../utils/env";

const UNAUTHORIZED = new Response("Unauthorized", { status: 401 });

function guardTest(request: Request) {
  const secret = process.env.TEST_SECRET;
  const provided = request.headers.get("x-test-secret");
  if (!secret || !provided || !timingSafeEqual(provided, secret)) return UNAUTHORIZED;
  return null;
}

/**
 * A `/test/*` route: the secret guard, the JSON body, and a JSON reply. The
 * body reaches the mutation unvalidated on purpose — the mutation's own `args`
 * validators are the check, and there is one of them rather than two.
 */
// oxlint-disable-next-line no-explicit-any -- the body is whatever the mutation validates.
function testRoute(run: (ctx: ActionCtx, body: any) => Promise<unknown>) {
  return httpAction(async (ctx, request) => {
    const denied = guardTest(request);
    if (denied) return denied;

    const result = (await run(ctx, await request.json())) ?? { ok: true };

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  });
}

export const createSession = testRoute((ctx, body) =>
  ctx.runMutation(internal.test.seed.createSession, body),
);

export const seedGame = testRoute((ctx, body) =>
  ctx.runMutation(internal.test.seed.seedGame, body),
);

export const addPlayer = testRoute((ctx, body) =>
  ctx.runMutation(internal.test.seed.addPlayer, body),
);

export const makeSelection = testRoute((ctx, body) =>
  ctx.runMutation(internal.test.seed.makeSelection, body),
);

export const cleanup = httpAction(async (ctx, request) => {
  const denied = guardTest(request);
  if (denied) return denied;

  await ctx.runMutation(internal.test.seed.cleanup);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
