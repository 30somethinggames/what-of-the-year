---
paths:
  - "convex/**"
---

# Convex rules

## Function shape

- Named `export const` using `query`/`mutation`/`action`/`internalMutation` from `./_generated/server`, with `args` validators and an async `handler` that destructures args in its signature.
- Validate every argument with `v.*`; hoist reused shapes to a module-level `const xArg = v.object({...})`.
- Shared helpers live in `convex/utils/*.ts` as plain async functions taking `ctx`/`db` first. Shared constants/enums live in `convex/constants.ts` as `as const` objects — always import them, never redefine locally.
- `export default` only for framework entrypoints (`schema.ts`, `http.ts`, `crons.ts`, `auth.config.ts`, `convex.config.ts`).

## The guard ladder (every mutation, in this order, before any db write)

1. **Auth**: `const identity = await ctx.auth.getUserIdentity(); if (!identity) throw new Error("Unauthenticated");` then `const uid = identity.subject;`
2. **Membership/host**: `requireSessionMember(ctx, sessionId)` (throwing), plus an `isHost` check for host-only actions (start/advance/end/kick).
3. **Rate limit**: `rateLimiter.limit(ctx, "<fnName>", { key: uid, throws: true })`, bucket registered in `convex/ratelimits.ts`.
4. **State assert**: verify the state the mutation assumes (round is `open`, session is `LOBBY`, etc.).

Skipping a step requires a code comment stating why.

## Authz contract: everything throws

Queries AND mutations throw on failed authz — never return `[]`/`null` to mask it. Thrown query errors surface through the root ErrorBoundary.

**Single exception**: `getSession` is auth-only by design — session IDs are unguessable capability URLs and are the invite mechanism, so non-members must read the session to reach the join screen. Do not add a second exception; pre-reveal data (picks) stays guarded by round state.

## Errors and queries

- Fail with `throw new Error("<Sentence case message>")` immediately after the guard, one guard per line. Never return error objects.
- Read through declared indexes: `.withIndex(...)` + `.unique()` for single docs. `.filter()` only narrows within an index, never as the sole selector.

## Tests

Every new or changed Convex function ships with `convex-test` coverage in the same PR, including negative authz cases (non-member, non-host, wrong state).
