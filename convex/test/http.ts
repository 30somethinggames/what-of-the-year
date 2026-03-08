import { internal } from "../_generated/api";
import { httpAction } from "../_generated/server";

const NOT_FOUND = new Response("Not Found", { status: 404 });

function isTestEnabled() {
  return process.env.IS_TEST === "true";
}

export const addPlayer = httpAction(async (ctx, request) => {
  if (!isTestEnabled()) return NOT_FOUND;

  const body = await request.json();
  const result = await ctx.runMutation(internal.test.seed.addPlayer, body);

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});

export const makeSelection = httpAction(async (ctx, request) => {
  if (!isTestEnabled()) return NOT_FOUND;

  const body = await request.json();
  await ctx.runMutation(internal.test.seed.makeSelection, body);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

export const cleanup = httpAction(async (ctx) => {
  if (!isTestEnabled()) return NOT_FOUND;

  await ctx.runMutation(internal.test.seed.cleanup);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
