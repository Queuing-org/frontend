# Reliability

## Core Rules

- Treat TanStack Query as the owner of REST-backed server state and invalidate every query affected by a mutation.
- Reconcile STOMP events with query cache or local state explicitly; do not assume a real-time event and REST history always arrive in order.
- Keep retries bounded and condition-specific. Do not retry generic authorization failures as transport failures.
- Surface loading, empty, error, and reconnecting states at the UI boundary that owns the workflow.
- Separate confirmed backend behavior from client-side defensive hypotheses in incidents and QA reports.

## Sensitive Flows

- Chat send confirmation uses `CHAT_MESSAGE`; missed confirmation may require bounded REST history backfill.
- Queue operations use queue `entryId`, not a track video identifier.
- Room password headers must be applied consistently to REST and relevant WebSocket operations.
- Query invalidation must cover every screen that consumes changed room, queue, user, badge, or relationship data.

Reusable failure evidence belongs in `agent-harness/incidents/`; task-specific verification belongs in the relevant execution plan.
