import { internal } from "../_generated/api";
import { httpAction } from "../_generated/server";
import { timingSafeEqual } from "../utils/env";

const UNAUTHORIZED = new Response("Unauthorized", { status: 401 });

function guardTest(request: Request) {
  const secret = process.env.TEST_SECRET;
  const provided = request.headers.get("x-test-secret");
  if (!secret || !provided || !timingSafeEqual(provided, secret)) return UNAUTHORIZED;
  return null;
}

export const addPlayer = httpAction(async (ctx, request) => {
  const denied = guardTest(request);
  if (denied) return denied;

  const body = await request.json();
  const result = await ctx.runMutation(internal.test.seed.addPlayer, body);

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});

export const makeSelection = httpAction(async (ctx, request) => {
  const denied = guardTest(request);
  if (denied) return denied;

  const body = await request.json();
  await ctx.runMutation(internal.test.seed.makeSelection, body);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const cleanup = httpAction(async (ctx, request) => {
  const denied = guardTest(request);
  if (denied) return denied;

  await ctx.runMutation(internal.test.seed.cleanup);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
