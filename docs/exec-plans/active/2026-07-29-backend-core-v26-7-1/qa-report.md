# QA Report

## Result

- classification: `pass`
- fresh reviewer first result: `fix`
  - 본인 음악력 버튼이 숨겨지던 문제 수정
  - 방 STOMP 재구독 훅 테스트 추가
- fresh reviewer re-review: `pass`

## Automated

- `npm run test`: pass — 30 files, 77 tests
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass

검증 범위에는 음악력 PUT/DELETE, badgeCode, queue cursor/revision/409 재시작, history cursorId, Retry-After, SSE 순차/중복 제거, presence 버전 순서, 방 WebSocket cache 변환·재구독, 상태 메시지 삭제, 지난 곡 pagination, 썸네일 편집 제거가 포함된다.

## Local Smoke

개발 서버를 HTTPS로 기동해 아래 경로의 서버 렌더 응답과 로그를 확인했다.

- `/home`: 200
- `/search`: 200
- `/room/nonexistent-v26-qa`: 200
- Next.js 서버 로그: compile/render 오류 없음

Codex in-app browser 연결은 코드와 무관한 실행 도구 메타데이터 오류(`sandboxPolicy` 누락)로 두 번 실패했다. HTTP smoke로 렌더 경로를 보완했으며, 이 실패를 브라우저 UI 검증 성공으로 간주하지 않았다.

## Residual Manual Scenarios

다음 항목은 인증된 두 계정과 실제 backend-core 이벤트/공개·비공개 방 fixture가 없어 수행하지 못했다.

- 두 사용자 음악력 즉시 동기화
- 실제 badge SSE 획득, 재연결, 연속 모달
- 팔로우 사용자 접속/방 이동 실시간 반영
- 공개·비공개 방 비밀번호 헤더의 실제 네트워크 확인

해당 경계는 자동 테스트로 검증했지만, 배포 전 통합 환경에서 별도 수동 확인이 필요하다.

## 2026-07-29 Room Entry Regression Follow-up

- classification: `pass`
- fresh read-only re-review: `pass`
- targeted tests: pass — 4 files / 10 tests
  - active-but-reconnecting client waits beyond the previous 5-second boundary
  - cancelled published join sends leave
  - reconnect restores join before a single room subscription and read invalidation
  - reconnect 중 route session cleanup aborts rejoin and publishes leave exactly once
  - query retries exclude 4xx/429 and preserve network/5xx recovery
- production query-level `retry: false` overrides: zero
- `npm run test`: pass — 33 files / 86 tests
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- local desktop Chrome `/home`: empty-room state rendered successfully
- live room entry/leave E2E: unavailable because `GET /api/v1/rooms?size=20` returned no rooms; no external fixture was created
- separate pre-existing evidence: mobile viewport home hydration mismatch from `useMediaQuery` initial server/client branch, outside this regression fix

## 2026-07-31 Authenticated Realtime Collision Follow-up

- classification: `pass`
- focused tests: pass — 3 files / 7 tests
  - auth state changes do not remount app children when badge SSE starts
  - follow presence owns a dedicated client and deactivates it on auth cleanup
  - room join subscribes to its response destination before immediate publish
- before-fix Chrome E2E:
  - mock `/me` success activates the same login-only providers as an authenticated session
  - shared socket frames: `SUBSCRIBE follow-presence -> SUBSCRIBE playlist/events -> SEND /join`
  - no `ROOM_JOINED`; UI reaches `room.join-timeout`
- after-fix Chrome E2E:
  - presence and room connect on separate WebSocket sessions
  - room frames: `SUBSCRIBE playlist/events -> SEND /join -> MESSAGE ROOM_JOINED`
  - playback, participants, chats, and room meta return 200
  - room content renders without refresh
  - `/home` remains rendered when `/me` changes from pending to authenticated
- removed: ineffective 250ms subscription settle delay
- residual risk: actual Google OAuth credential entry was not automated; affected-user post-deploy recheck remains required
- `npm run test`: pass — 33 files / 87 tests
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- fresh read-only QA: `pass`
