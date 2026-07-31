# Handoff

- phase: ci-pending
- branch: `feat/backend-core-v26-7-1`
- base: `origin/main@2619fb06`
- commits:
  - `3d46756` API 계약/재시도
  - `45067d3` 프로필/presence
  - `6e5801e` 방 데이터/UI
  - `2b8325b` SSE/WebSocket
- verification: subscription/join race focused 1 file/6 tests, full 33 files/88 tests, lint/build/diff check pass; fresh read-only QA pass
- manual_smoke: `/home`, `/search`, `/room/nonexistent-v26-qa` 200
- pr: https://github.com/Queuing-org/frontend/pull/28
- next_action: subscription/join race 수정 커밋을 기존 PR #28에 push하고 checks를 재확인
- blockers: shared backend 방 목록이 비어 있어 수정 후 실제 방 입장/퇴장 Chrome E2E는 미수행
