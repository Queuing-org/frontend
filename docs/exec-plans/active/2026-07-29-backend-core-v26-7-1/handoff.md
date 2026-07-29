# Handoff

- phase: publishing
- branch: `feat/backend-core-v26-7-1`
- base: `origin/main@2619fb06`
- commits:
  - `3d46756` API 계약/재시도
  - `45067d3` 프로필/presence
  - `6e5801e` 방 데이터/UI
  - `2b8325b` SSE/WebSocket
- verification: test 30 files/77 tests, lint, build, fresh QA `pass`
- manual_smoke: `/home`, `/search`, `/room/nonexistent-v26-qa` 200
- next_action: push 후 Draft PR 생성, CI와 리뷰 대기
- blockers: 인증된 두 계정과 실제 이벤트를 요구하는 수동 시나리오는 로컬 자격증명 부재로 미수행
