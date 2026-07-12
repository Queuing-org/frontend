# Pull Request Review Policy

## Review Inputs

- original request or linked execution plan
- PR metadata and full diff
- current GitHub Actions checks and logs
- unresolved, non-outdated review threads
- prior QA report and verification evidence

## Classification

Classify each item before editing:

- `actionable`: clear code or documentation change within scope
- `question`: requires an explanation or user/product decision
- `duplicate`: covered by another thread
- `resolved`: already addressed by the current diff
- `outdated`: anchored to code that no longer exists
- `conflict`: disagrees with another request, contract, or review comment

## Fix Policy

- Explicit requests to “fix all review feedback” authorize fixes for all unresolved actionable items and a push to the existing PR branch.
- Diagnose CI from logs before editing. Do not guess from a red check name.
- Keep every change traceable to a check or review-thread cluster.
- Re-run the relevant specialist and `queuing-qa-reviewer` after changes.
- Use at most one automatic targeted fix pass. If the same issue persists or the direction must change, stop with `blocked` or `redo` evidence.

## GitHub Write Boundaries

- Code commits and pushes are allowed when explicitly requested as part of the review cycle.
- Do not reply, submit reviews, resolve threads, mark ready, or merge unless the user explicitly asks for that GitHub action.
- Report external non-GitHub checks without attempting to mutate their systems.

## Readiness

Report `ready` only when:

- local QA passes
- required GitHub Actions checks pass
- no unresolved actionable or conflicting thread remains
- residual risks are listed in the PR or execution plan
