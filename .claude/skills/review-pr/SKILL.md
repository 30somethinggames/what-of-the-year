---
name: review-pr
description: Review a pull request against the repo rules, the ticket it closes, and a high-bar bug pass; post a verdict summary plus inline findings. Used by the review workflow with the PR number as the argument.
allowed-tools: Bash, Read, Glob, Grep, Agent, mcp__github_inline_comment__create_inline_comment
---

# Review PR

You are the pipeline's reviewer. The argument is a PR number in this repository. A human still reads every PR — your job is to make that read fast and to catch what the rules say must never merge. Never approve, request changes, or merge through GitHub review state; you only comment.

## 0. Should this run?

`gh pr view <n> --json state,isDraft,headRefName,body,title,comments`. Stop silently if the PR is closed or a draft.

Find an existing summary comment (body starts with `<!-- review-pr -->`). If one exists this is a **re-run** — the reviewer runs on every push. Keep the comment id for editing, parse its Blocking / Should fix / Nits / Still open items as the **prior findings**, and `gh api repos/{owner}/{repo}/pulls/<n>/comments?per_page=100` to list existing inline comments (path, line, body). You will diff the new review against these in step 6, never restate them.

## 1. Gather

- **Ticket**: the `Closes #<t>` line in the PR body → `gh issue view <t> --comments`. If there is no `Closes` line, note it — that is a finding.
- **Diff**: `gh pr diff <n>` and `gh pr diff <n> --name-only`.
- **Rules**: read `CLAUDE.md`, then read every `.claude/rules/*.md` whose `paths:` frontmatter globs match at least one changed file. Every bullet in those files is a checklist item. Do not invent rules that are not written there.

## 2. Ticket fit

One or two sentences: does the diff do what the ticket asks? List anything the diff does that the ticket did not ask for, and anything the ticket asked for that is missing. If the ticket is ambiguous enough that you cannot tell, the verdict is **needs human**.

## 3. Checklist

For each rule bullet from step 1, decide **pass / fail / n/a** against the diff. A fail needs a `path:line` and a short quote of the rule. Checks that need context outside the diff (e.g. is the awaited mutation wrapped in `tryCatch` at its call site; does a `convex-test` file cover the changed function) — read the surrounding file, do not guess.

Always check, regardless of paths:

- Forbidden zone untouched: `.github/**`, `.claude/**`, `src/routeTree.gen.ts`, `package.json` dependencies, `bun.lock`.
- `Closes #<t>` present and `<t>` matches the branch `agent/<t>-…` (agent PRs only).
- All four PR template sections are filled; **Verification** says what was actually run, not just "checks pass".
- No test was weakened: no loosened assertions, added retries, `.skip`, `.only`, or deleted cases.

Do **not** comment on commit or PR title format — that is a CI check (#104), not a review finding.

## 4. Bug pass

Launch one **opus** subagent (`model: "opus"`) with the PR title, body, and full diff. Instructions for it:

> Scan the diff for bugs. Diff only — do not read other files. Flag only issues you are certain of: code that will not compile or type-check, logic that is wrong regardless of input, security holes visible in the changed lines. Do not flag style, potential issues that depend on specific state, pre-existing code, or anything a linter catches. If you are not certain, do not flag it. Return a list of `{path, line, description}`.

For **each** finding, launch a separate **opus** validator subagent with the PR title, body, the finding, and permission to read the repository. It must answer: is this definitely a real issue in this PR? Drop anything not confirmed.

## 5. Verdict

- **request changes** — any of: ticket fit fails; forbidden zone touched; a test was weakened; a confirmed bug; a fail on a `CLAUDE.md` invariant; a fail on the Convex guard ladder or authz contract; a new or changed Convex function without `convex-test` coverage including negative cases.
- **needs human** — you cannot determine ticket fit; the PR's Verification section excuses a failed check and you cannot judge the excuse; anything else you are unsure how to weigh.
- **approve** — everything else. Nits do not block.

## 6. Post

**Summary comment** — create with `gh pr comment <n> --body-file`, or on a re-run edit the existing one in place with `gh api -X PATCH repos/{owner}/{repo}/issues/comments/<id> -f body=@file`. Exact shape:

```
<!-- review-pr -->
## Review — <approve | request changes | needs human>

**Ticket fit:** <one or two sentences; out-of-scope items if any>

### Blocking
- <rule or bug> — `path:line` — <one line>

### Should fix
- …

### Nits
- …

### Still open
- <finding raised in an earlier run, unchanged> — `path:line`

### Checklist
- CLAUDE.md ✅ 4/4
- convex.md ❌ 6/7 — guard ladder: `startRound` skips rate limit without a comment
- react.md ✅ 3/3
- routing.md n/a
- styling.md n/a
- testing.md ✅ 2/2
```

Omit empty sections. Blocking = anything that drove **request changes**; Should fix = other rule fails; Nits = judgement calls that do not block. Checklist is one bullet per rules file, status and count first, then any note — never joined on one line.

**On a re-run**, every finding is one of three things — decide by comparing against the prior findings and the current diff, same issue = same rule or bug at the same place (line numbers may have shifted):

- **Fixed** — the code no longer has it. Drop it entirely.
- **Still open** — prior finding, code unchanged. Move it to `### Still open` as a one-liner; do not re-explain it, do not post a new inline comment.
- **New** — not in the prior findings. Goes in Blocking / Should fix / Nits with a fresh inline comment.

The verdict reflects the current state (fixed Blocking items no longer block). Edit the existing summary in place; never post a second summary.

**Inline comments** — for every Blocking and Should fix item with a concrete `path:line`, post one comment with `mcp__github_inline_comment__create_inline_comment`. Include a committable suggestion block only when applying it fixes the issue entirely. Never post one for a Still open item — its original inline comment is still on the PR.

## Do not

- Post a GitHub review (`gh pr review`) in any state.
- Flag things not written in `CLAUDE.md` or `.claude/rules/*.md` unless they came through the bug pass.
- Pad the review. A clean PR gets `approve`, the ticket-fit line, and the checklist — nothing else.
