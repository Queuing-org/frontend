# Queuing Context Ledger

Last refreshed: 2026-07-12

## Purpose

This file is the durable cross-session memory for AI-assisted work on queuing-org.
It is not a transcript. It stores only context that a future agent or engineer
should recover after the chat session is gone.

Use it to prevent the common failure mode where a new session starts from the
codebase alone and forgets prior workflow decisions, known risks, and handoff
state.

## Bootstrap Read Order

For resumed, complex, or boundary-crossing work, read in this order:

1. `AGENTS.md`
2. `docs/agent-harness/context-ledger.md`
3. The relevant run under `docs/exec-plans/active/` and its `handoff.md` when present
4. `docs/agent-harness/team-spec.md`
5. Relevant skills under `.agents/skills/`
6. Relevant incidents under `docs/agent-harness/incidents/`

For simple one-file fixes, `AGENTS.md` plus direct code inspection is enough.

## Stable Project Context

- Queuing is a Next.js App Router MVP for room-based music queues.
- Route assembly belongs in `src/app`.
- User-facing feature behavior belongs in `src/features`.
- Shared API/UI helpers belong in `src/shared`.
- Server state is managed through TanStack Query.
- The highest-risk boundary is API payload shape -> hook -> UI state -> query invalidation.
- Modal, room, queue, websocket, password, and thumbnail flows need explicit error and loading paths.

## Harness Context

The repo uses a lightweight harness, not a heavyweight agent framework:

- `AGENTS.md` gives every session the stable repo-wide rules.
- `.agents/skills/*` defines reusable specialist behavior.
- `docs/agent-harness/team-spec.md` defines routing, handoffs, and failure policy.
- `docs/exec-plans/active/{run}/*` stores task-level handoff artifacts; completed runs move to `docs/exec-plans/completed/`.
- `docs/agent-harness/incidents/*` stores confirmed reusable lessons.

The current architecture pattern is `Pipeline + Producer-Reviewer`:

1. request snapshot
2. API/UI boundary design
3. implementation
4. QA review
5. incident promotion when a reusable lesson was found

## Context Persistence Rules

- Do not rely on chat history for project memory.
- Put durable rules in this ledger, the team spec, a skill, or an incident.
- Put task-local state in the relevant active run's `handoff.md`.
- Update this ledger only when the information should survive many sessions.
- Prefer incident records for detailed debugging evidence; keep this ledger short and pointer-heavy.
- If a change creates a new reusable rule, update the relevant skill in the same change.
- If a session ends with unresolved work, update the relevant active run's `handoff.md` before stopping.

## What Belongs Here

- Durable project constraints that are easy to forget.
- Current harness architecture and read order.
- Cross-session decisions that affect future agent behavior.
- Pointers to incidents, specs, and handoff files.
- Known context gaps that a future session must not paper over.

## What Does Not Belong Here

- Full conversation logs.
- Raw command output.
- One-off implementation notes.
- Long code explanations.
- Hypotheses that were not checked.
- Temporary model-specific prompting tricks.

## Known Context Risks

- API docs and observed server behavior may disagree. Prefer observed request/response evidence and record uncertainty explicitly.
- Existing user changes may be present in the working tree. Inspect `git status --short` before editing and do not revert unrelated changes.
- Room password semantics are sensitive: do not send empty password strings as "keep password" unless the API explicitly supports it.
- Queue item operations use `entryId`, not the track video id.
- Korean IME composition must be respected before submitting Enter-driven text inputs.
- Browser wheel cancellation needs a native non-passive listener when `preventDefault()` is required.

## Current Portfolio Angle

The strongest AI-use story is not "AI wrote the code." It is:

> I designed a repo-local context and handoff harness so AI coding agents can
> recover project intent across sessions, route work through API/UI/QA
> specialists, preserve failure evidence, and keep human verification explicit.

That story should be backed by this ledger, `AGENTS.md`, `.agents/skills/*`,
`docs/exec-plans/active/{run}/*`, and the incident records.
