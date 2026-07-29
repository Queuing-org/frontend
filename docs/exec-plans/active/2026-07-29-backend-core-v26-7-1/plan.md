# backend-core v26.7.1 프론트 마이그레이션

## Scope

- 기준 문서: `backend-core v26.7.1-beta.1`
- 기준 브랜치: `origin/main` (`2619fb06`, PR #27 병합 커밋)
- 작업 브랜치: `feat/backend-core-v26-7-1`
- breaking/additive REST 계약, React Query 캐시, 방 UI, 전역 SSE/STOMP 실시간 처리를 한 Draft PR로 전달한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership

- REST 서버 상태: TanStack Query
- 방 playback/participants/queue/history: playlist/room feature의 개별 query
- 방 실시간 이벤트: room page 전용 hook이 runtime guard와 캐시 조정을 소유
- 칭호 SSE 및 팔로우 presence 구독: 로그인 사용자 범위의 앱 provider에서 각각 한 번 연결
- 칭호 알림 순서/중복 제거: badge feature client provider의 일시 UI 상태
- 프로필 설정 입력: settings feature local form state

## Commit Slices

1. `feat(api): v26.7.1 REST 계약과 재시도 정책 반영`
   - 음악력 enum/PUT/DELETE
   - badgeCode 계약
   - playback/participants/queue/history 페이지 계약
   - 검색/regionRestriction 제거
   - Retry-After 및 조회 429 재시도
   - 제거된 방 썸네일 수정 API/UI 삭제
   - API 단위 테스트
2. `feat(profile): 상태 메시지와 팔로우 접속 상태 반영`
   - statusMessage 설정/프로필 UI
   - follower/following presence 필드/카드/전역 STOMP 구독
   - 버전 역전 방지 테스트
3. `feat(room): 음악력 투표와 분리된 방 데이터 UI 적용`
   - 3상태 음악력 버튼
   - playback/participants/queue 통합
   - 지난 곡 탭과 명시적 더 보기
   - UI 테스트
4. `feat(realtime): 칭호 SSE와 방 이벤트 캐시 동기화`
   - badge-awarded 순차 모달/중복 제거
   - MUSIC_POWER_CHANGED, TRACK_STARTED runtime guard
   - 재연결 단일 구독/재검증
   - 상태 및 접근성 테스트
5. `docs: v26.7.1 마이그레이션 QA 증거 기록`
   - API/UI/구현/QA/변경 요약 및 delivery state

## Acceptance Criteria

- 사용자/현재 곡 신청자 음악력 투표가 UPVOTE/DOWNVOTE/DELETE 계약과 3상태 UI를 지킨다.
- 칭호 식별자는 모든 API/UI에서 `badgeCode`를 사용한다.
- 방 화면에서 `/state`를 사용하지 않고 playback/participants/playlist API를 조합한다.
- 큐의 모든 cursor 페이지를 `queueRevision`과 함께 읽고 409 conflict 시 한 번만 처음부터 재시작한다.
- history는 `cursorId` infinite query와 `더 보기` 버튼을 사용한다.
- 조회 429만 최대 두 번 재시도하며 `Retry-After`와 지수 백오프 중 긴 시간을 사용한다.
- statusMessage, follow presence, badge SSE, room websocket 변경을 UI와 캐시에 반영한다.
- 제거된 검색 통계, regionRestriction, 기존 방 썸네일 수정 호출/UI가 남지 않는다.
- `npm run test`, `npm run lint`, `npm run build`가 통과한다.
- fresh read-only QA 결과가 `pass`다.

## Progress

- [x] PR #27 병합 확인
- [x] 최신 `origin/main`에서 작업 브랜치 생성
- [x] API 문서 원문 확인
- [x] REST 계약 및 공통 재시도
- [x] 방 query 분리/페이지네이션
- [x] 프로필/팔로우 UI
- [x] 전역 SSE/STOMP 및 방 실시간 처리
- [x] 테스트/린트/빌드
- [x] fresh QA
- [x] 기능 단위 커밋
- [x] push/Draft PR

## Decisions

- 칭호 이미지는 대체 필드가 없으므로 새 이미지를 만들거나 호환 필드를 추정하지 않는다.
- 검색 통계를 복구하기 위한 N+1 프로필 요청은 만들지 않는다.
- 큐 conflict 재시작은 무한 반복하지 않고 전체 조회 단위당 한 번으로 제한한다.
- 기존 방 썸네일 편집은 백엔드 대체 API가 없으므로 제거한다. 생성 전 임시 업로드는 유지한다.

## Verification

- Targeted Vitest suites per feature: pass
- `npm run test`: pass, 33 files / 86 tests
- `npm run lint`: pass
- `npm run build`: pass
- fresh read-only QA: `pass`
- 로컬 HTTP smoke: `/home`, `/search`, 동적 room 경로 200

## Residual Risk

- 두 계정, 실제 SSE 재연결, 공개/비공개 방 비밀번호 헤더 검증은 유효한 테스트 계정과 실행 중 백엔드가 필요하다.
- 방 입장 회귀 수정 후 shared backend에 방 fixture가 없어 실제 Chrome 입장/퇴장 E2E는 재수행하지 못했다. STOMP 세션 순서는 회귀 테스트로 검증했다.
- 모바일 viewport의 기존 `useMediaQuery` hydration mismatch는 이번 PR 이전 코드에도 존재하는 별도 이슈다.
