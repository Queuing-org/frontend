# Execution Plans

Execution plans are versioned artifacts for complex or resumable work. Small, local changes do not need one.

## Lifecycle

1. Create `active/YYYY-MM-DD-short-slug/`.
2. Add `plan.md` with scope, acceptance criteria, progress, decisions, verification, and residual risk.
3. Add only the supporting artifacts the task needs: `request-summary.md`, `api-contract.md`, `ui-flow.md`, `implementation-notes.md`, `qa-report.md`, `handoff.md`, and `change-summary.md`.
4. Keep `active/README.md` synchronized with current runs.
5. When the work is complete, mark the plan complete and move the whole run to `completed/`.

The run directory is the task boundary. Do not reuse one run for unrelated work or overwrite evidence from a completed run.
