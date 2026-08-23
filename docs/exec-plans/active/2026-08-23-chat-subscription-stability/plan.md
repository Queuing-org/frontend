# 채팅 STOMP 구독 안정화

## Scope

- 채팅 메시지 수신·삭제·로컬 상태 갱신으로 렌더가 발생해도 동일 room slug와 access token의 채팅 구독을 유지한다.
- 구독 callback은 최신 handler를 호출하되 handler identity 변경만으로 `UNSUBSCRIBE → SUBSCRIBE`하지 않는다.
- room slug, access token, 활성화 상태처럼 구독 자체의 identity가 바뀌는 경우에만 기존 구독을 정리하고 새로 등록한다.
- 재현 및 회귀 테스트와 재사용 가능한 websocket subscription lifecycle 규칙을 남긴다.

## Acceptance Criteria

- 같은 slug·access token에서 callback prop이 교체되어도 채팅 topic subscribe 호출과 기존 subscription의 unsubscribe 횟수가 늘지 않는다.
- callback 교체 이후 들어온 메시지는 최신 callback으로 전달된다.
- 채팅 수신으로 화면 상태가 갱신되어도 message 간 짧은 미구독 구간이 생기지 않는다.
- access token 변경과 unmount에서는 기존 구독이 정확히 한 번 정리된다.
- 기존 채팅 전송 오류·pending backfill 동작을 회귀시키지 않는다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`
- `queuing-incident-curator`

## Ownership

- room chat composition callback: `src/features/room/chat/hooks/useRoomChat.ts`
- STOMP chat subscription lifecycle: `src/features/room/chat/hooks/useRoomChatRealtime.ts`
- regression evidence: chat hook tests
- reusable lesson: `docs/agent-harness/incidents` and room/QA skills

## Commit Slices

1. `fix(chat): 렌더 중 STOMP 채팅 구독 유지`
2. `docs(incident): 채팅 구독 생명주기 회귀 규칙 기록`

## Progress

- [x] 제보와 실제 callback dependency chain 대조
- [x] 최신 `main` 기준 shared `dev` fast-forward
- [x] 실패 재현 테스트
- [x] callback·subscription lifecycle 수정
- [x] targeted/full QA와 fresh read-only review
- [ ] commit, push, Draft PR

## Verification

- chat subscription lifecycle targeted Vitest
- existing realtime/history targeted Vitest
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`

## Residual Risk

- 운영 STOMP frame의 실제 짧은 미구독 구간은 브라우저·백엔드 세션을 사용한 통합 관찰이 필요하다.
- 백엔드가 별도로 transport를 종료하는 경우는 이 callback identity 문제와 다른 재연결 경로다.
