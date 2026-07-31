# Review Findings

## 2026-07-29 방 입장 회귀

- source: 사용자 재현 보고 및 로컬 브라우저/네트워크 진단
- classification: actionable
- symptoms:
  - 방 입장 시 간헐적으로 WebSocket 연결 제한 시간 5초를 초과한다.
  - 방 진입 뒤 데이터가 비어 있고 새로고침해야 복구되는 경우가 있다.
- confirmed causes:
  - 전역 follow presence가 STOMP client를 앱 범위에서 활성화하면서 `reconnectDelay=5000ms`와 방 입장 대기 제한 `5000ms`가 정확히 경쟁한다.
  - STOMP 재연결 시 방 topic만 다시 구독하고 새 WebSocket 세션의 `/join` handshake를 재실행하지 않는다.
  - SPA에서 방을 나갈 때 서버에 명시적 leave를 보내지 않아 동일 소켓에 이전 참가자 세션이 남는다.
- intended fix:
  - 공유 STOMP 연결 대기를 이벤트 기반으로 만들고 재연결 지연보다 충분한 제한 시간을 사용한다.
  - 재연결 시 방 join handshake를 먼저 복구한 뒤 단일 topic 구독과 REST 재검증을 수행한다.
  - route cleanup과 입장 중 unmount 모두 명시적 leave로 정리한다.
  - 관련 세션 생명주기 회귀 테스트와 실제 브라우저 진입/퇴장 확인을 추가한다.
- resolution:
  - implemented event-driven connect wait with a 12-second boundary
  - implemented abortable join and `/app/room/{slug}/leave`
  - implemented reconnect join -> single subscription -> room read invalidation
  - restored network/5xx query retries while excluding 4xx/429
  - removed production query-level retry overrides so the global policy reaches room reads
  - assigned reconnect cleanup ownership to the room hook so abort publishes leave exactly once
  - cleared rejected reconnect passwords and stale subscription config
- verification:
  - targeted Vitest: 4 files / 10 tests pass
  - full Vitest: 33 files / 86 tests pass
  - lint/build: pass
  - fresh read-only QA: pass
  - desktop Chrome `/home`: pass
  - live room entry/leave E2E: unavailable because the shared backend returned an empty room list

## 2026-07-31 user-event 구독/join 경쟁

- source: 사용자 Dia DevTools WebSocket frame 캡처 및 live API/STOMP 진단
- classification: actionable
- evidence:
  - 실패 세션은 `CONNECTED -> SUBSCRIBE /user/playlist/events -> SEND /join -> UNSUBSCRIBE` 순서였고 `ROOM_JOINED`가 없었다.
  - 대상 공개 방 `nIw81kKS`의 REST meta/state는 200이었으며 participants는 비어 있었다.
  - 같은 컴퓨터의 분리된 Chrome/Dia 세션은 존재하는 공개 방에서 `ROOM_JOINED`까지 정상 수신했다.
  - backend broker는 `SUBSCRIBE receipt` 요청에 8초 안에 `RECEIPT`를 반환하지 않았다.
- resolution:
  - user-event 구독 뒤 250ms 안정화 구간을 거쳐 join을 한 번만 publish한다.
  - 안정화 중 abort는 예약 publish를 취소하며 join/leave를 발행하지 않는다.
- residual risk:
  - 250ms는 broker receipt로 확인된 ACK가 아닌 호환 완화다. 영향 사용자 환경의 post-change 재검증이 필요하다.
- verification:
  - focused Vitest: 1 file / 6 tests pass
  - full Vitest: 33 files / 88 tests pass
  - lint/build/diff check: pass
  - fresh read-only QA: pass
