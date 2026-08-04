# Delivery State

- status: publishing
- branch: dev
- base: main
- issue:
- pr: https://github.com/Queuing-org/frontend/pull/33
- selected_skills: queuing-feature-delivery, queuing-orchestrator, queuing-api-boundary, queuing-ui-flow, frontend-architecture-guardrails, queuing-qa-reviewer
- local_qa: v2 byte identity pass; targeted 1 file / 5 tests pass; lint pass; 56 files / 140 tests pass; build pass; diff-check pass; fresh QA pass
- ci: consistency fix f3e9dbf checks were running when the request was superseded; v2 image replacement pending
- review_threads: CodeRabbit actionable 7 resolved; outdated doc thread 1; live Codex duplicate 1 is addressed by the same pagination fix
- next_action: v2 자산 교체 관련 파일만 명시적으로 stage해 commit/push하고 PR #33 checks를 확인한다.
