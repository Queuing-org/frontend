# 프로필 UI 및 backend hotfix/260814 잔여 전환

## Scope

- 공용 모바일 기준을 `480px`로 축소하고 홈·방 런타임 분기와 관련 CSS media query를 통일한다.
- 방/친구 프로필 크기·스크롤·간격·팔로우 색상과 권한 기반 presence 점을 반영한다.
- 선택적 탈퇴·차단 사유와 500자 UI 검증을 추가한다.
- 중복 방 참가 실패의 무단 leave를 막고 STOMP `ERROR`의 세션 교체를 terminal room cleanup으로 연결한다.
- 방 안 음악력 조회·투표를 `roomSlug + entryId` 재생 건별 계약으로 전환한다.
- 기존 chat 신고 사유, 이미 전환된 REST/204/cursor/room 삭제/채팅 삭제 계약은 유지한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `frontend-architecture-guardrails`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `queuing-qa-reviewer`

## Ownership Decisions

- 모바일 경계와 desktop density 판정은 `src/shared/lib/viewportDensity.ts`가 런타임 기준을 소유한다.
- profile/follow server state와 presence reconciliation은 TanStack Query cache가 소유한다.
- 탈퇴·차단 사유는 각 확인 UI의 로컬 상태가 소유하고 API 함수는 trim/본문 생략 규칙만 소유한다.
- room join cleanup은 `joinRoom`, terminal realtime cleanup은 `useRoomRealtimeEvents`가 소유한다.
- 재생 건별 음악력 query key와 mutation cache 동기화는 user profile query/model 계층이 소유한다.

## Commit Slices

1. `feat(ui): 모바일 기준과 프로필 상태 UI 정비`
2. `fix(api): hotfix 참가·사유·음악력 계약 반영`
3. `docs(delivery): hotfix 잔여 전환 검증 기록`

## Acceptance Criteria

- `375px`, `480px`만 모바일 홈/방 구조를 사용하고 `481px`, `600px`, `760px`는 데스크톱 구조를 사용한다.
- 방 프로필은 411/328.8px, 친구 프로필은 최소 380/304px이며 안전 여백이 부족할 때만 내부 스크롤한다.
- presence 값이 제공된 프로필/팔로우 항목에만 접근성 라벨이 있는 초록/빨간 점을 표시하고 상태 문구는 숨긴다.
- 팔로우 전은 파랑, 팔로잉은 회색이며 관계 mutation 뒤 프로필과 목록을 재검증한다.
- 탈퇴·차단 사유는 선택적이고 trim한 빈 값은 body를 생략하며 500자 초과 제출을 막는다.
- `room.already-participating`은 새 대상 room leave를 보내지 않고, 취소/timeout cleanup은 유지한다.
- STOMP `ERROR`의 `user.session-replaced`가 방 로컬 cache/subscription/chat만 정리하고 room auto reconnect를 중단한다.
- 음악력 조회/투표/key가 room/entry 단위이며 이미 투표한 버튼은 요청 없이 지정 안내를 보여준다.

## Progress

- [x] 저장소 규칙, 기존 커밋, backend `038f991f` 계약 확인
- [x] 관련 코드와 테스트 매핑
- [x] 반응형·프로필 UI 구현 및 검증
- [x] API·실시간 계약 구현 및 검증
- [x] lint, 전체 test, build, diff-check
- [x] fresh QA review와 로컬 커밋

## Verification

- 관련 targeted Vitest: 35 tests 통과
- `npm run lint`: 통과
- `npm run test`: 125 files, 467 tests 통과
- `npm run build`: 통과
- `git diff --check`: 통과
- fresh QA review: `pass`, blocking finding 없음

## Residual Risk

- 인앱 브라우저 인스턴스가 없어 `375/480/481/600/760px` 실제 렌더와 computed overflow는 수동 확인하지 못했다.
- 실제 인증 권한 조합의 presence와 다중 브라우저 session replacement, 종료 직후 재입장 broker 타이밍은 통합 환경 확인이 남는다.
