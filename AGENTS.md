# Queuing Agent Guide

## WHAT

Queuing is a Next.js App Router MVP for room-based music queues. Route assembly lives in `src/app`, domain data and API contracts live in `src/entities`, user-facing capabilities live in `src/features`, composed surfaces live in `src/widgets`, and shared API/UI helpers live in `src/shared`.

## WHY

Most project risk is at API/UI/state boundaries: API payload shape, React Query cache updates, room password headers, websocket state, modal state ownership, and CSS interaction details. Keep reusable workflow rules in `.agents/skills/` and durable harness docs in `docs/harness/queuing/`.

## HOW

- Use TanStack Query for server state and invalidate every query affected by a mutation.
- Use local component state for transient UI state unless the state must be shared across screens.
- For complex feature work, API troubleshooting, or repeated QA flows, start from `.agents/skills/queuing-orchestrator/SKILL.md`.
- Use `.agents/skills/queuing-api-boundary/SKILL.md` for API docs, payload, hook, type, and cache-boundary work.
- Use `.agents/skills/queuing-ui-flow/SKILL.md` for room/home/search UI workflows and interaction states.
- Use `.agents/skills/queuing-qa-reviewer/SKILL.md` before finishing high-risk API/UI changes.
- Document troubleshooting, performance improvements, and reusable fixes with the analysis format in `docs/harness/queuing/templates/incident.md`; keep portfolio draft notes in ignored `docs/portfolio-notes/`.
- For code changes, verify with `npm run lint` and `npm run build` unless the task is docs-only or the user explicitly skips verification.
