# STOMP Worker heartbeat 안정화

## Scope

- 공용 STOMP 클라이언트의 outgoing heartbeat ticker를 기본 `Interval`에서 `Worker`로 전환한다.
- room membership와 follow presence가 공유하는 heartbeat, 5초 재접속, 인증·재가입 lifecycle은 그대로 유지한다.
- page visibility lifecycle이나 백엔드 room cleanup 정책은 변경하지 않는다.

## Acceptance Criteria

- `createStompClient`가 `TickerStrategy.Worker`를 설정한다.
- `heartbeatIncoming`, `heartbeatOutgoing`은 각각 4000ms이고 기본 `reconnectDelay`는 5000ms로 유지된다.
- 기존 room reconnect 테스트에서 access token 유지·회전, 재가입·재구독, REST 재검증이 계속 통과한다.
- 관련 Vitest, lint, 전체 test, production build가 통과한다.

## Selected Skills

- `queuing-feature-delivery`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership

- transport configuration: `src/shared/api/websocket/createStompClient.ts`
- configuration regression evidence: `src/shared/api/websocket/createStompClient.test.ts`
- room/follow feature state ownership과 API 계약은 변경하지 않는다.

## Commit Slices

1. `fix(websocket): 백그라운드 heartbeat에 Worker 적용`
2. 게시 후 delivery state만 달라질 경우 `docs(delivery): heartbeat 안정화 게시 상태 기록`

## Progress

- [x] 스킬·아키텍처·브랜치·현재 구현 재확인
- [x] Worker heartbeat 설정과 단위 테스트 구현
- [x] targeted/full automated QA
- [x] fresh read-only review — `pass`
- [x] commit, push, Draft PR #56

## Verification

- `npx vitest run src/shared/api/websocket/createStompClient.test.ts`
- room reconnect targeted Vitest
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`

결과: implementation targeted 5 files/28 tests, reviewer targeted 5 files/33 tests, full 149 files/590 tests, lint, production build 통과.

## Residual Risk

- Worker는 outgoing heartbeat timer throttling만 완화하며 탭 discard, OS 절전, 완전한 page freeze를 보장하지 않는다.
- Blob Worker를 차단하는 외부 CSP가 있다면 운영 브라우저에서 `worker-src blob:` 허용 여부를 별도로 확인해야 한다.
- 백엔드의 삭제 예약 취소·삭제 직전 방장 세션 재검증은 프론트 변경 범위 밖이다.
