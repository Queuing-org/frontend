# Documentation Structure Consolidation

- status: complete
- started: 2026-07-12
- scope: documentation and repo-local agent guidance only

## Goal

Keep Codex-discovered bootstrap files in their required locations while consolidating durable project knowledge and versioned execution records under `docs/`.

## Acceptance Criteria

- `AGENTS.md` remains the short bootstrap and points to canonical docs.
- `.agents/skills/` remains the only repo-local skill source.
- the duplicate `.codex/skills/harness/` copy is removed.
- durable harness docs live under `docs/agent-harness/`.
- task artifacts use run-scoped `docs/exec-plans/active|completed/` directories.
- architecture and documentation indexes reflect the actual source tree.
- no live guidance references `docs/harness/queuing` or `_workspace`.

## Progress

- [x] classify existing harness and workspace artifacts
- [x] move durable harness docs and archive prior task artifacts
- [x] update all live path references and contracts
- [x] add canonical architecture and documentation indexes
- [x] validate links, paths, and repository diff

## Decisions

- Keep `AGENTS.md` and `.agents/skills/` outside `docs/` because Codex discovers them by convention.
- Treat architecture, product, reliability, and security docs as shared project knowledge rather than AI-only documentation.
- Replace singleton workspace files with run-scoped execution plans to avoid stale or overwritten evidence.

## Verification

- `git diff --check`: pass
- local Markdown relative-link scan: 51 files checked, pass
- legacy live-path scan: no live guidance references the removed directories
- runtime verification: skipped because the change is documentation and agent guidance only

## Residual Risk

- Documentation structure is not yet enforced by CI; this remains recorded in `docs/exec-plans/tech-debt.md`.
