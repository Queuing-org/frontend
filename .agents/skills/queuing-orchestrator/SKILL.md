---
name: queuing-orchestrator
description: Coordinate complex queuing-org feature, API, troubleshooting, and QA work through repo-local specialist skills and deterministic handoffs.
---

# Queuing Orchestrator

## When to Use

Use this skill for work that crosses two or more project boundaries:

- API contract plus UI state
- room, playlist, search, auth, friend, or profile feature work with cache updates
- production-like troubleshooting that may need a durable incident record
- changes that need explicit QA before final handoff

Do not use it for one-off copy, CSS token, or single-file tweaks unless the change reveals a reusable project rule.

## Required Inputs

- user request and target screen or workflow
- affected route, feature, entity, or API endpoint when known
- relevant screenshots, logs, API docs, or prior incident links
- expected verification level: lint, build, manual browser check, API check, or docs-only

If any input is missing, inspect the repository first and make the narrowest project-local assumption.

## Workflow

1. Snapshot the request in `_workspace/00_input/request-summary.md` for complex work.
2. Classify the work:
   - API/data boundary: use `queuing-api-boundary`.
   - UI interaction/state/CSS flow: use `queuing-ui-flow`.
   - post-change boundary review: use `queuing-qa-reviewer`.
   - recurring failure or troubleshooting lesson: use `queuing-incident-curator`.
3. Inspect code before editing. Prefer existing project patterns over new abstractions.
4. Implement the smallest change that satisfies the request and preserves existing behavior.
5. Run targeted verification. For code changes, default to `npm run lint` and `npm run build`.
6. If a reusable failure was discovered, create or update a durable incident and update the relevant skill or team spec.
7. Final handoff must summarize changed files, verification, and any residual risk.

## Handoff Contract

Use these names when the workflow is large enough to preserve intermediate evidence:

- `_workspace/00_input/request-summary.md`
- `_workspace/01_api_contract.md`
- `_workspace/02_ui_flow.md`
- `_workspace/03_implementation_notes.md`
- `_workspace/04_qa_report.md`
- `_workspace/final/change-summary.md`

Small tasks can skip `_workspace/` files, but should still follow the same mental sequence.

## Failure Policy

- If API docs, observed network behavior, and current code disagree, treat the real request/response as evidence and document the mismatch.
- If a server returns 500 for ambiguous client input, do not invent a confirmed root cause. Record confirmed payloads, logs, and remaining hypotheses separately.
- If lint or build fails from pre-existing unrelated warnings, report them without hiding new failures.
- If a change touches room update, queue mutation, websocket state, or room password behavior, require QA review before final handoff.

## Outputs

- code or docs changes requested by the user
- optional `_workspace/` handoff artifacts for complex work
- optional `docs/harness/queuing/incidents/YYYY-MM-DD-*.md` for durable lessons
- final response with verification status and known risks

## References

- Team spec: `docs/harness/queuing/team-spec.md`
- API specialist: `.agents/skills/queuing-api-boundary/SKILL.md`
- UI specialist: `.agents/skills/queuing-ui-flow/SKILL.md`
- QA reviewer: `.agents/skills/queuing-qa-reviewer/SKILL.md`
- Incident curator: `.agents/skills/queuing-incident-curator/SKILL.md`
