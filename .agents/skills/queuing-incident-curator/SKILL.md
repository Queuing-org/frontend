---
name: queuing-incident-curator
description: Convert queuing-org troubleshooting, performance work, and reusable fixes into durable analysis records, rules, and skill updates.
---

# Queuing Incident Curator

## When to Use

Use this skill when troubleshooting, performance work, or a reusable fix reveals a project lesson:

- repeated API/client mismatch
- ambiguous server behavior or 500 investigation
- UI state ownership mistake likely to recur
- cache invalidation or websocket sync failure
- performance improvement with a measurable or structural reason
- refactor or fix where the rejected alternatives matter for future work
- a verification gap that should become a checklist item

Do not use it for small bugs that are fully fixed and unlikely to change future behavior.

## Required Inputs

- symptom and exact error/log when available
- reproduction steps or statement that reproduction failed
- previous code or request shape
- updated code or final request shape
- the concrete problem in the previous code
- tested alternatives and their results
- why the chosen solution was selected over alternatives
- final code change or recommended rule
- whether the lesson is confirmed, disproven, or still a hypothesis

## Workflow

1. Preserve raw notes in `docs/portfolio-notes/` when they are portfolio draft notes, scratch investigation notes, performance-improvement notes, or personal analysis.
2. Promote a lesson to `docs/harness/queuing/incidents/YYYY-MM-DD-short-slug.md` only when it should affect future work.
3. Separate sections:
   - problem
   - previous behavior
   - previous code
   - updated code
   - problem in the previous code
   - evidence
   - confirmed cause or remaining hypotheses
   - solution options
   - chosen solution and rationale
   - result
   - rule to reuse
   - skill/team-spec updates
4. If the rule changes future behavior, update the relevant skill:
   - API behavior: `queuing-api-boundary`
   - UI/state behavior: `queuing-ui-flow`
   - review behavior: `queuing-qa-reviewer`
   - workflow/routing behavior: `queuing-orchestrator`
5. Do not overstate unverified causes. Mark them as hypotheses.

## Outputs

- durable incident or improvement analysis under `docs/harness/queuing/incidents/`
- optional updates to `.agents/skills/*/SKILL.md`
- optional team spec update when role boundaries or handoffs change

## Validation

- The incident distinguishes facts from guesses.
- The record shows previous code, updated code, why the previous code was flawed, considered solutions, why the chosen solution won, and the result.
- The reusable rule is short enough to apply during future work.
- The linked skill or team spec actually changed when the rule should affect behavior.
- Local scratch notes remain ignored unless explicitly promoted.
