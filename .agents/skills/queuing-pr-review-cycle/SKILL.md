---
name: queuing-pr-review-cycle
description: Continue a queuing-org pull request after publication by inspecting GitHub Actions failures and unresolved review threads, routing fixes through the relevant project skills, rerunning QA, committing, and pushing the PR branch. Use when the user asks to check, fix, or address a current PR, CI failure, requested changes, unresolved review comments, or review readiness; do not use for initial feature implementation before a PR exists.
---

# Queuing PR Review Cycle

Resume an existing delivery run and process CI or review feedback without silently performing merge or review-state mutations. Read `references/review-policy.md` before GitHub writes.

## Inputs

- PR number, URL, or current branch PR
- linked execution plan or original user request
- GitHub CLI authentication
- local checkout of the PR branch

## Workflow

1. Read `AGENTS.md`, `ARCHITECTURE.md`, the review policy, and the linked active run.
2. Confirm `gh --version` and `gh auth status`, resolve the PR, and confirm the local branch matches its head branch. Inspect the full diff and current worktree before editing.
3. Update `delivery-state.md` to `reviewing`.
4. Inspect checks and feedback independently.
   - Use the installed `gh-fix-ci` workflow for GitHub Actions checks and logs.
   - Use the installed `gh-address-comments` workflow for thread-aware unresolved review context.
   - Treat external check providers as report-only unless separately authorized.
5. Write or update `review-findings.md`, grouping CI failures and threads by the classifications in the review policy.
6. Determine the required Queuing skills from the affected boundaries and read them before editing.
   - API/cache/header changes: `queuing-api-boundary`.
   - UI/state/CSS changes: `queuing-ui-flow`.
   - Frontend architecture changes: `frontend-architecture-guardrails`.
7. Implement only the authorized actionable fixes. Draft explanations for question-only comments instead of forcing code changes.
8. Run targeted verification plus `npm run lint` and `npm run build`, then run `queuing-qa-reviewer` against the original request, PR diff, findings, and checks.
9. If QA passes, commit only review-related changes and push the existing PR branch. Allow one targeted automatic fix pass; stop if the same failure persists or QA says `redo`.
10. Recheck GitHub Actions and unresolved actionable threads when possible. Set delivery state to `ready`, `ci-pending`, or `blocked` according to evidence.
11. Report addressed findings, remaining threads, verification, CI state, and whether explicit human action is still required.

## Failure Policy

- Do not infer the cause of a failed check without logs.
- Do not treat flat PR comments as the complete unresolved-thread state.
- Stop when review comments conflict with each other, the product contract, or the original request.
- Do not reply, submit a review, resolve threads, mark ready, merge, force-push, or delete branches unless the user explicitly requests that action.
- Preserve the active run and `handoff.md` when authentication, logs, or product decisions block progress.

## Outputs

- classified CI and review findings
- scoped fixes, verification evidence, commit, and push when authorized
- updated delivery state and readiness report

## Reference

- Read `references/review-policy.md` for finding classification, fix limits, GitHub write boundaries, and readiness criteria.
