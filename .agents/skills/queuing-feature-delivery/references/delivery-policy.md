# Feature Delivery Policy

## Branch Naming

Choose the prefix from the request:

- `feat/{issue}-{slug}` for user-visible capabilities
- `fix/{issue}-{slug}` for defects
- `refactor/{issue}-{slug}` for behavior-preserving structural work
- `chore/{issue}-{slug}` for tooling, documentation, or maintenance

Omit `{issue}-` when no issue number exists. Use short lowercase hyphen-case slugs.

## Delivery States

Record these fields in the active run's `delivery-state.md`:

```md
# Delivery State

- status: planned
- branch:
- base: main
- issue:
- pr:
- selected_skills:
- local_qa:
- ci:
- review_threads:
- next_action:
```

Allowed status values:

- `planned`
- `branch-created`
- `implementing`
- `local-review`
- `publishing`
- `ci-pending`
- `reviewing`
- `ready`
- `completed`
- `blocked`

## Commit Policy

Plan feature-sized commit slices before implementation and record the intended order in the active run.

- Use Conventional Commit messages in the form `<type>(scope): 한국어 요약`. Omit `(scope)` when it would not add useful context.
- Allowed types are `feat`, `fix`, `refactor`, `test`, `docs`, and `chore`.
- Keep code and the tests that prove that behavior in the same feature commit.
- Do not use vague summaries such as `WIP`, `수정`, or `작업`.
- Run the relevant targeted verification before every commit.
- Before publishing a code-change PR, run `npm run lint`, `npm run test`, and `npm run build`.
- Summarize the feature commits and verification results in the PR body.

Update the state after each phase boundary. Do not mark `ready` unless local QA passed and no known blocking CI or review issue remains.

## Skill Routing

| Boundary | Required skill |
| --- | --- |
| complex or cross-boundary feature | `queuing-orchestrator` |
| API client, payload, types, headers, React Query cache | `queuing-api-boundary` |
| room, home, search, modal, queue, CSS interaction | `queuing-ui-flow` |
| React/Next.js implementation or refactor | `frontend-architecture-guardrails` |
| high-risk or multi-step code change | `queuing-qa-reviewer` |
| reusable failure or performance lesson | `queuing-incident-curator` |

List selected skills in `plan.md` before editing. A task may use several skills sequentially; that does not require several agents editing in parallel.

When collaboration agents are available:

- keep the main delivery agent as integration owner
- allow bounded API/UI analysis agents only when their scopes and outputs are independent
- use a fresh read-only QA reviewer agent after implementation
- pass file-based artifacts and the actual diff between roles
- never let workers commit, push, open PRs, or edit overlapping files

## Publish Gate

Publish only when:

- the diff matches the newest request
- unrelated user changes are excluded
- required local verification passed or the residual risk is explicitly accepted
- QA result is `pass`
- commit scope and branch name match the run

Use the installed GitHub publish skill when available. Otherwise use local `git` for branch, stage, commit, and push, then `gh pr create --draft` for the PR. Populate the repository PR template with the execution-plan and QA evidence.

## Authority Boundaries

- Feature-delivery invocation authorizes creating a scoped branch, committing intended files, pushing that branch, and opening a draft PR.
- Never stage unrelated files silently.
- Never force-push, merge, mark ready for review, submit a review, resolve threads, or delete branches without an explicit request.
- Stop when the base branch or worktree scope is ambiguous, GitHub authentication is missing, or validation reveals a direction-level defect.
