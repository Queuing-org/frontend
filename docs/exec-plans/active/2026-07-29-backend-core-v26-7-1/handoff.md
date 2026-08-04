# Handoff

- phase: ready
- branch: `feat/backend-core-v26-7-1`
- base: `origin/main@2619fb06`
- commits:
  - `3d46756` API 계약/재시도
  - `45067d3` 프로필/presence
  - `6e5801e` 방 데이터/UI
  - `2b8325b` SSE/WebSocket
  - `393ceba` user-event 구독/join 안정화
  - `f8e2e5b` 로그인 실시간 연결 생명주기 분리
- verification: auth lifecycle focused 3 files/7 tests, full 33 files/87 tests, lint/build/diff check, fresh QA pass; login-activated Chrome E2E `/home` and public room pass
- manual_smoke: authenticated-provider `/home` rendered; public room `ROOM_JOINED` and playback/participants/chats/meta 200
- pr: https://github.com/Queuing-org/frontend/pull/28
- next_action: 영향 사용자 실제 Google 로그인 세션에서 `/home`과 방 입장 재검증
- blockers: 실제 Google OAuth credential flow는 자동화하지 않아 영향 사용자 post-deploy 재검증 필요
