# Delivery State

- status: publishing
- branch: dev
- base: main
- issue:
- pr: https://github.com/Queuing-org/frontend/pull/33
- selected_skills: queuing-feature-delivery, queuing-orchestrator, queuing-api-boundary, queuing-ui-flow, frontend-architecture-guardrails, queuing-qa-reviewer
- local_qa: consistency targeted 1 file / 5 tests pass; lint pass; 56 files / 140 tests pass; build pass; diff-check pass; fresh QA pass
- ci: previous head 892d737 GitHub Actions and Vercel success; consistency fix pending
- review_threads: CodeRabbit actionable 7 resolved; outdated doc thread 1; live Codex duplicate 1 is addressed by the same pagination fix
- next_action: consistency fix 관련 파일만 명시적으로 stage해 commit/push하고 PR #33 checks를 재확인한다.
