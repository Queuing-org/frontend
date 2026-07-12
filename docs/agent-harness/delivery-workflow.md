# Feature Delivery Workflow

## Goal

Turn a feature, fix, or refactor request into a scoped branch, verified implementation, and draft pull request, then resume asynchronously for CI and review feedback.

## Architecture

Primary pattern: `Pipeline + Producer-Reviewer`.

```text
request
  -> queuing-feature-delivery
  -> boundary specialists
  -> queuing-qa-reviewer
  -> commit / push / draft PR
  -> GitHub Actions
  -> queuing-pr-review-cycle
  -> human merge decision
```

One implementation owner edits by default. API, UI, architecture, and incident skills are selected from the affected boundaries. When collaboration agents are available, independent boundary analysis may be delegated only for non-overlapping scopes, and final QA should use a fresh read-only reviewer agent. Agents must not edit overlapping files in parallel merely to appear multi-agent.

## Roles

| Role | Skill | Responsibility |
| --- | --- | --- |
| Delivery orchestrator | `queuing-feature-delivery` | preflight, run, branch, specialist routing, QA gate, publish |
| Implementation coordinator | `queuing-orchestrator` | cross-boundary analysis and implementation integration |
| API specialist | `queuing-api-boundary` | clients, payloads, hooks, types, headers, cache |
| UI specialist | `queuing-ui-flow` | interactions, state ownership, CSS, shared surfaces |
| Architecture guard | `frontend-architecture-guardrails` | route, server/client, provider, abstraction, testability boundaries |
| QA reviewer | `queuing-qa-reviewer` | independent pass/fix/redo decision |
| PR review coordinator | `queuing-pr-review-cycle` | CI logs, review threads, scoped fixes, readiness |
| Incident curator | `queuing-incident-curator` | durable reusable failure evidence |

## State And Handoff

Each complex delivery owns one directory under `docs/exec-plans/active/YYYY-MM-DD-short-slug/`. Add `delivery-state.md` for branch, PR, selected skills, QA, CI, review threads, and next action. Move the full run to `completed/` only after delivery is complete or deliberately closed.

## Automation Boundary

- A feature-delivery request authorizes a scoped branch, intended commit, branch push, and draft PR.
- CI validates pushes and pull requests; it does not start a Codex session.
- PR feedback is resumed by invoking `queuing-pr-review-cycle`, unless a separate trusted event-driven agent runner is added later.
- Draft PR is the default. Ready-for-review, review submission, thread resolution, merge, force-push, and branch deletion require explicit user action.

## Repository Gates

- Local code gate: `npm run lint` and `npm run build`.
- Review gate: `queuing-qa-reviewer` returns `pass`.
- Remote gate: `.github/workflows/ci.yml` succeeds.
- Merge gate: configure GitHub branch protection to require the CI check and human approval. This setting is external to the repository and must be verified separately.

## Normal Flow

1. User asks for a feature, fix, or refactor.
2. Delivery skill inspects the worktree and creates the run and branch.
3. It records and uses the specialists required by the changed boundaries.
4. QA reviews the diff and permits at most one targeted fix pass.
5. Delivery skill commits, pushes, and opens a draft PR using the repository template.
6. After CI or review feedback arrives, the PR review skill resumes the same run.
7. A human decides when to mark ready and merge.

## Failure Flow

- Mixed worktree: stop before branch or staging until scope is explicit.
- Missing GitHub auth: keep local work and active handoff; do not fake publication.
- QA `redo`: stop before PR creation.
- Repeated CI failure or conflicting review feedback: set the run to `blocked` and request a decision.
