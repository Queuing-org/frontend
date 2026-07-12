# Queuing Agent Guide

## WHAT

Queuing is a Next.js App Router MVP for room-based music queues. Route assembly lives in `src/app`, user-facing capabilities and domain-specific API/model/UI code live in `src/features`, and cross-feature API/UI helpers live in `src/shared`. Read `ARCHITECTURE.md` for the canonical dependency map.

## WHY

Most project risk is at API/UI/state boundaries: API payload shape, React Query cache updates, room password headers, websocket state, modal state ownership, and CSS interaction details. Keep reusable workflow rules in `.agents/skills/` and durable harness docs in `docs/agent-harness/`.

## HOW

- Use TanStack Query for server state and invalidate every query affected by a mutation.
- Use local component state for transient UI state unless the state must be shared across screens.
- For feature, fix, or refactor requests intended for repository delivery, use `.agents/skills/queuing-feature-delivery/SKILL.md`; it owns the branch, specialist routing, QA, commit, push, and draft PR flow. Skip Git/GitHub delivery only when the user explicitly requests local-only work.
- For an existing PR with failing checks or review feedback, use `.agents/skills/queuing-pr-review-cycle/SKILL.md`.
- For implementation, review, or refactoring, read `ARCHITECTURE.md` before editing and keep its documented boundaries in sync with structural changes.
- For complex feature work, API troubleshooting, or repeated QA flows, start from `.agents/skills/queuing-orchestrator/SKILL.md`.
- Use `.agents/skills/queuing-api-boundary/SKILL.md` for API docs, payload, hook, type, and cache-boundary work.
- Use `.agents/skills/queuing-ui-flow/SKILL.md` for room/home/search UI workflows and interaction states.
- Use `.agents/skills/queuing-qa-reviewer/SKILL.md` before finishing high-risk API/UI changes.
- For frontend implementation, review, or refactoring, apply `frontend-architecture-guardrails` before editing to check ownership, state, route/page separation, provider scope, API hooks, and testable logic.
- For complex work, create or resume a run under `docs/exec-plans/active/`; use `docs/exec-plans/README.md` for the lifecycle and artifact contract.
- For resumed or context-heavy work, read `docs/agent-harness/context-ledger.md`, then the relevant active run and its `handoff.md` when present.
- Document troubleshooting, performance improvements, and reusable fixes with the analysis format in `docs/agent-harness/templates/incident.md`; keep portfolio draft notes in ignored `docs/portfolio-notes/`.
- Use `docs/README.md` as the canonical index for architecture, product, reliability, security, plans, and agent-harness knowledge.
- For code changes, verify with `npm run lint` and `npm run build` unless the task is docs-only or the user explicitly skips verification.
