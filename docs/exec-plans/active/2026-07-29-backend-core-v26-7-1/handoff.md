# Handoff

- phase: verification-complete
- branch: `feat/backend-core-v26-7-1`
- base: `origin/main@2619fb06`
- commits:
  - `3d46756` API 계약/재시도
  - `45067d3` 프로필/presence
  - `6e5801e` 방 데이터/UI
  - `2b8325b` SSE/WebSocket
  - `393ceba` user-event 구독/join 안정화
- verification: subscription/join race focused 1 file/6 tests, full 33 files/88 tests, lint/build/diff check pass; fresh read-only QA pass
- manual_smoke: `/home`, `/search`, `/room/nonexistent-v26-qa` 200
- pr: https://github.com/Queuing-org/frontend/pull/28
- next_action: 영향 사용자 Dia 환경에서 subscription/join race 수정 후 실제 방 입장을 재검증
- blockers: 250ms 안정화 구간은 broker ACK가 아니므로 영향 사용자 환경의 post-change 검증이 필요함
