# QA Report

## Result

- local verdict: pass
- fresh read-only review: initial `fix`; 사용자 전환 pending 생명주기 보강 후 `pass`

## Reproduction Evidence

- callback identity만 교체하는 baseline 회귀 테스트: `subscribeRoomChatEvents` 예상 1회, 실제 2회로 실패
- fresh review의 사용자 로그아웃 경계 테스트: 남은 timer 예상 0개, 실제 1개로 실패

## Verified Lifecycle Matrix

- 동일 room slug·token에서 message/delete callback 교체: 재구독 없음, 최신 callback 수신
- 동일 user slug에서 사용자 객체 교체: chat/user 구독과 pending 유지
- user slug 제거: chat 구독 유지, user 구독과 pending 정리
- room access token 변경: chat 구독만 교체, user 구독 유지
- room slug 변경: chat/user 구독 교체, pending 정리
- `isEnabled=false`: chat/user 구독과 pending 정리
- unmount: subscription, timer, stale in-flight backfill 정리

## Commands

- `npm run test -- src/features/room/chat/hooks/useRoomChatRealtime.test.tsx src/features/room/chat/hooks/useRoomChatHistory.test.tsx src/features/room/page/ui/RoomPlaybackScreen.test.tsx` — 3 files / 23 tests passed
- `npm run lint` — passed
- `npm run test` — 149 files / 589 tests passed
- `npm run build` — passed
- `git diff --check` — passed

## Residual Risk

- 운영 broker의 `UNSUBSCRIBE` frame 감소와 누락 메시지 timestamp 상관관계는 실제 세션 관찰이 필요하다.
- 실제 WebSocket transport close는 이번 동일 연결 내 subscription churn과 별도 재연결 경로다.
