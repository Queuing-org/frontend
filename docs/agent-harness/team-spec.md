# Queuing Team Spec

## Goal

Make queuing-org feature work repeatable without turning every task into heavyweight process. The harness should help with the project's real recurring risks: API/UI contract drift, React Query cache invalidation, room and playlist state, modal/control state ownership, drag interactions, and troubleshooting lessons.

## Architecture Pattern

Primary pattern: `Pipeline + Producer-Reviewer`.

Reason:

- Most work flows from request analysis -> API/UI design -> implementation -> QA.
- A separate QA pass is valuable when API payloads, cache keys, websocket state, or shared controls are touched.
- Full fan-out is optional and should only be used for independent API/UI/review slices.

## Context Persistence Layer

AI sessions are disposable. The harness must preserve reusable context in files
instead of assuming a future session can remember prior chat.

| Artifact | Purpose | Update When |
| --- | --- | --- |
| `AGENTS.md` | short repo-wide bootstrap rules loaded every session | a rule matters on most tasks |
| `docs/agent-harness/context-ledger.md` | durable cross-session memory and read order | a decision should survive many sessions |
| `docs/exec-plans/active/{run}/handoff.md` | current task state for session resume | a session ends with unresolved or easily-forgotten context |
| `docs/agent-harness/templates/session-handoff.md` | reusable handoff format | the handoff shape changes |
| `docs/agent-harness/incidents/*.md` | detailed reusable failure evidence | troubleshooting changes future behavior |

Bootstrap rule:

- For resumed, complex, or boundary-crossing work, read `AGENTS.md`,
  `docs/agent-harness/context-ledger.md`, and the relevant run under
  `docs/exec-plans/active/` before planning edits.
- For simple one-file fixes, skip the full context layer and inspect the code
  directly.

## Roles

| Role | Responsibility | Skill | Writes |
| --- | --- | --- | --- |
| Orchestrator | Classify the request, choose specialists, preserve handoffs, and own final integration. | `.agents/skills/queuing-orchestrator/SKILL.md` | `docs/exec-plans/active/{run}/request-summary.md`, `docs/exec-plans/active/{run}/change-summary.md` |
| API Boundary Specialist | Align endpoint docs, client payloads, response types, hooks, and cache invalidation. | `.agents/skills/queuing-api-boundary/SKILL.md` | `docs/exec-plans/active/{run}/api-contract.md` |
| UI Flow Specialist | Own component state, CSS modules, interaction details, shared controls, and modal behavior. | `.agents/skills/queuing-ui-flow/SKILL.md` | `docs/exec-plans/active/{run}/ui-flow.md` |
| QA Reviewer | Compare both sides of changed boundaries and classify pass/fix/redo. | `.agents/skills/queuing-qa-reviewer/SKILL.md` | `docs/exec-plans/active/{run}/qa-report.md` |
| Incident Curator | Promote troubleshooting lessons, performance improvements, and reusable fixes into durable analysis records and skill updates. | `.agents/skills/queuing-incident-curator/SKILL.md` | `docs/agent-harness/incidents/YYYY-MM-DD-*.md` |

## Request Routing

| Request type | Use |
| --- | --- |
| Simple one-file UI or CSS tweak | Direct implementation; no harness artifact required. |
| Shared home/search controls, modal behavior, drag/drop, responsive UI | `queuing-ui-flow`; QA if behavior is shared or risky. |
| API client, hook, payload, type, auth/password header, cache invalidation | `queuing-api-boundary`; QA required. |
| Room create/update/delete/join or playlist add/move/delete/playback | `queuing-api-boundary` + `queuing-ui-flow`; QA required. |
| Reproducing a server/client bug, unclear 500, performance improvement, or reusable fix | `queuing-api-boundary` or `queuing-ui-flow` + `queuing-incident-curator`; QA when code changes. |
| Reusable workflow, large feature, or multi-surface refactor | `queuing-orchestrator` with optional `docs/exec-plans/active/{run}/` artifacts. |

## Phase Order

### Phase 1: Request Snapshot

- Inputs: newest user request, screenshots/logs/API docs, current repo state.
- Actions: identify target workflow, affected files, and risk level.
- Output: `docs/exec-plans/active/{run}/request-summary.md` for complex work.
- Completion: the scope is narrow enough to implement without guessing.

### Phase 2: Boundary Design

- Inputs: request snapshot and relevant source files.
- Actions: inspect API/client/UI/state boundaries before editing.
- Outputs: `docs/exec-plans/active/{run}/api-contract.md` and/or `docs/exec-plans/active/{run}/ui-flow.md` when useful.
- Completion: the payload, state owner, cache keys, and interaction states are explicit.

### Phase 3: Implementation

- Inputs: boundary design and current code.
- Actions: make scoped edits using existing project patterns.
- Output: `docs/exec-plans/active/{run}/implementation-notes.md` for large work.
- Completion: code or docs match the latest request.

### Phase 4: QA Review

- Inputs: original request, diff, and boundary artifacts.
- Actions: compare producer/consumer sides and run verification.
- Output: `docs/exec-plans/active/{run}/qa-report.md` for risky work.
- Completion: `pass`, `fix`, or `redo` status is explicit.

### Phase 5: Analysis Record Promotion

- Inputs: troubleshooting evidence, performance findings, before/after code, alternatives, and QA findings.
- Actions: decide whether the lesson belongs in durable harness docs.
- Output: `docs/agent-harness/incidents/YYYY-MM-DD-*.md` and optional skill updates.
- Completion: recurring lessons have before/after code, problem analysis, considered alternatives, chosen rationale, result, and a reusable rule.

## Active Run Contract

Use a run-scoped directory only when the task is large enough that intermediate evidence matters. Follow `docs/exec-plans/README.md` and keep names deterministic:

```text
docs/exec-plans/active/YYYY-MM-DD-short-slug/
├── plan.md
├── request-summary.md
├── handoff.md
├── api-contract.md
├── ui-flow.md
├── implementation-notes.md
├── qa-report.md
└── change-summary.md
```

Small tasks can skip files but must still preserve the reasoning in the final response.

## Failure Policy

- If docs and observed API behavior disagree, prefer observed evidence and record the mismatch.
- If a root cause is not reproduced, mark it as unknown. Do not promote a hypothesis into a rule.
- If a reusable rule is created, update the relevant skill in the same change.
- If verification cannot run, final handoff must state why and what risk remains.
- Cap review loops at one targeted fix pass unless the user asks for deeper iteration.

## Durable Analysis Record Policy

Promote a troubleshooting, performance, or reusable-fix record when it changes future behavior. Good examples:

- "PATCH room update should send only changed fields."
- "Queue delete uses entryId and must invalidate roomQueue."
- "Shared control behavior must be wired in both home and search."
- "Queue list rendering was optimized by memoizing X instead of virtualizing because the bottleneck was Y."

Every promoted record must include:

- previous code or request shape
- updated code or final request shape
- the problem in the previous code
- solution options considered
- chosen solution and why it won
- result and verification

Do not promote:

- a one-off typo
- raw logs without analysis
- a guess that was not tested

## Validation Commands

Default for code changes:

```bash
npm run lint
npm run build
```

Known existing warnings may appear in lint. Report them separately from new failures.

## Test Scenarios

### Normal Flow

- Request: add or change a room/playlist UI feature that calls an API.
- Expected: API contract is checked, UI state ownership is explicit, code is changed, QA verifies cache/state behavior, lint/build pass.

### Failure Flow

- Failure: an API returns 500 or behavior differs from docs.
- Expected: reproduce or clearly fail to reproduce, separate facts from hypotheses, apply a defensive client fix when appropriate, create an incident only if the lesson is reusable.
