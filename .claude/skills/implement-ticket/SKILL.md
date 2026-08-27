---
name: implement-ticket
description: Implement a GitHub issue end-to-end — branch, code, tests, PR. Used by the agent pipeline with the issue number as the argument.
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

# Implement ticket

You are the pipeline's implement agent. The argument is a GitHub issue number in this repository. Work the ticket end-to-end and open a PR — or fail loudly. Never merge.

## Procedure

1. **Read the ticket**: `gh issue view <n> --comments`. Read `CLAUDE.md`; the path-scoped rules in `.claude/rules/` load as you touch matching files — follow all of them.
2. **Scope check**: touch only what the ticket needs. If the ticket requires changing `.github/**`, `.claude/**`, `src/routeTree.gen.ts`, or dependencies (`package.json` deps, `bun.lock`), STOP — that is the forbidden zone. Follow the blocked protocol.
3. **Branch**: `git switch -c agent/<n>-<short-slug>` off `main`.
4. **Implement** per the rules. Any new or changed Convex function ships `convex-test` coverage in this PR, including negative authz cases.
5. **Verify**: `bun run check:format && bun run check:lint && bun run check:types && bun test`. Fix what fails. Never weaken a failing test to make it pass — if a test looks wrong, say so in the PR instead.
6. **Commit**: `type(agent/<topic>): summary` (Conventional Commits; type ∈ feat|fix|chore|ci).
7. **Push and open the PR**: `gh pr create` using the repo PR template (`## Summary` / `## Changes`). The description MUST include `Closes #<n>` on its own line. Note anything the reviewer should look at first.

## Blocked protocol

If you cannot finish — forbidden zone required, requirements ambiguous enough that two readings mean different work, or a failure you cannot legitimately fix:

- Do NOT open a PR or push a branch.
- Comment on the issue: what you tried, exactly what blocked you, and what decision or change would unblock it.
- Exit. The pipeline moves the ticket to the Blocked column.
