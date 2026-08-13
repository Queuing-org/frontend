# Delivery State

- status: ci-pending
- branch: `dev`
- base: `main`
- pull_request: https://github.com/Queuing-org/frontend/pull/48
- selected_skills:
  - `queuing-feature-delivery`
  - `queuing-ui-flow`
  - `frontend-architecture-guardrails`
  - `queuing-qa-reviewer`
- local_verification:
  - `npm run test -- --run src/features/room/floating/model/useFloatingWidgetsState.test.ts` — 1 file / 15 tests passed
  - `npm run lint` — passed
  - `npm run test` — 118 files / 405 tests passed
  - `npm run build` — passed
  - `git diff --check` — passed
- fresh_qa: pass
- residual_risk: 연결 가능한 브라우저가 없어 실제 화면에서 drag 후 새 위치를 눈으로 확인하지 못함
- next_action: Draft PR #48 원격 CI 확인
