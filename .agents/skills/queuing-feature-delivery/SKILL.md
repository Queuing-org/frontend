---
name: queuing-feature-delivery
description: Deliver queuing-org features, fixes, and refactors through a scoped Git branch, project-specific implementation skills, local QA, commit, push, and a draft GitHub pull request. Use automatically when the user asks to add or change functionality and expects repository delivery, including requests such as “기능 추가해줘”, “버그 수정해서 PR 올려줘”, “브랜치부터 PR까지 진행해줘”, or equivalent feature-to-PR work; skip only when the user explicitly requests local-only work, analysis, or no Git/GitHub changes.
---

# Queuing Feature Delivery

Run a bounded delivery pipeline from request to draft PR. Read `references/delivery-policy.md` before mutating Git or GitHub state.

## Inputs

- newest user request and explicit non-goals
- issue number or URL when available
- expected base branch, defaulting to the remote default branch
- screenshots, API docs, logs, or acceptance criteria
- current worktree, branch, remote, and GitHub authentication state

## Workflow

1. Read `AGENTS.md`, `ARCHITECTURE.md`, `docs/exec-plans/README.md`, and the delivery policy.
2. Inspect `git status -sb`, the current branch, remote, intended base, and diff before changing branches.
   - If unrelated changes are present, stop and ask which files belong to this delivery.
   - If all existing changes are explicitly in scope, preserve them and create the delivery branch without stashing or resetting.
3. Create or resume `docs/exec-plans/active/YYYY-MM-DD-short-slug/` with `plan.md` and `delivery-state.md`.
4. Create the branch named by the policy. Do not implement feature work directly on the default branch.
5. Classify boundaries and record `selected_skills` before editing.
   - Use `queuing-orchestrator` for complex or cross-boundary work.
   - Use `queuing-api-boundary` for API, payload, hook, type, header, or cache work.
   - Use `queuing-ui-flow` for user interaction, room/home/search, modal, queue, or CSS flow work.
   - Apply `frontend-architecture-guardrails` to frontend implementation, review, or refactoring.
   - Use `queuing-incident-curator` if the task produces a durable failure lesson.
6. Read every selected skill fully, inspect the relevant code, and implement the smallest coherent change.
7. Run targeted verification plus `npm run lint` and `npm run build` for code changes. Record commands and results in the active run.
8. Run `queuing-qa-reviewer` against the original request, actual diff, contracts, and verification evidence.
   - When collaboration agents are available, delegate this read-only review to a fresh bounded reviewer agent. Give it the request, diff, relevant contracts, and command results, but not the implementer's preferred conclusion. The delivery owner remains responsible for fixes and integration.
   - When collaboration agents are unavailable, perform the same structured review in the current agent before publishing.
   - `pass`: continue.
   - `fix`: apply one targeted fix pass, rerun verification, and review again.
   - `redo`: stop before publishing and report the direction-level conflict.
9. Inspect the final diff and stage only files belonging to the run. Write a concise conventional commit, using a Korean summary when the repository work is Korean-facing.
10. Confirm `gh --version` and `gh auth status`, then push the branch and open a draft PR.
    - Use the installed GitHub publish skill when available, but preserve this skill's branch policy and explicit staging scope.
    - Populate `.github/pull_request_template.md` with the request, impact, verification, selected skills, QA result, execution-plan path, and residual risk.
11. Set delivery state to `ci-pending`, store the PR URL, and return branch, commit, PR, checks run, and remaining risks.

## Failure Policy

- Never hide pre-existing or unrelated changes in the delivery commit.
- Keep one integration owner. Specialist agents may analyze independent boundaries or review the result, but must not edit overlapping files in parallel.
- Never invent an issue number, API contract, successful check, or review result.
- Stop on missing GitHub authentication before push or PR creation; keep local work and resume from the active run after authentication.
- Do not force-push, merge, mark ready for review, resolve threads, or delete branches without an explicit request.
- Keep a failed or interrupted run active with a current `handoff.md` and `next_action`.

## Outputs

- scoped feature branch and intentional commit
- active execution-plan artifacts and QA evidence
- draft pull request using the repository template
- delivery-state update with branch, PR, CI state, and next action

## Reference

- Read `references/delivery-policy.md` for branch names, state values, specialist routing, publish gates, and authority boundaries.
