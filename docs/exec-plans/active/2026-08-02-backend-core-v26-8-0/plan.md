# backend-core v26.8.0 프론트 마이그레이션

## Scope

- 기준 문서: 사용자 제공 `backend-core v26.8.0-beta.1` 프론트 변경 안내
- 기준 브랜치: `feat/backend-core-v26-7-1@185e17a`
- 작업 브랜치: `feat/backend-core-v26-8-0`
- queue 구간 조회, 고정곡 순서, 공개 식별자, join/access 오류, session replacement, thumbnail 계약을 반영한다.
- 특정 계정의 백엔드 상태 문제를 프론트 문제로 오인해 추가한 방 입장 polling/강제 navigation/근거 없는 실시간 충돌 우회와 문서 주장을 제거한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-incident-curator`
- `queuing-qa-reviewer`

## Ownership

- queue 페이지 서버 상태: TanStack infinite query
- queue 다음 구간 로드와 탭 수량: room queue panel hook
- 개인 순서 제한/오류: queue reorder domain helper와 sortable UI
- room session replacement: room-scoped realtime hook
- app-wide follow presence: 전용 STOMP client, room session 종료와 독립
- 공개 식별: backend 응답의 `participantId`, `userSlug`, `slug`만 사용

## Commit Slices

1. `feat(api): v26.8.0 페이지와 공개 식별 계약 반영`
2. `feat(queue): 구간 조회와 고정곡 순서 UI 반영`
3. `feat(realtime): 대체된 방 세션의 재접속 중단`
4. `docs: 잘못된 방 입장 진단과 v26.8.0 QA 기록 정정`

## Acceptance Criteria

- queue는 첫 페이지만 진입 시 읽고 cursor+queueRevision으로 다음 페이지를 명시적으로 읽는다.
- queue conflict는 캐시를 비우고 첫 페이지부터 다시 시작한다.
- 탭 수는 `totalPendingCount`를 사용한다.
- 일반 사용자는 owner locked 곡을 움직이거나 reorder payload에 포함하지 않는다.
- rooms API는 `lastId` legacy 경로를 전송하지 않는다.
- participant/owner/addedBy/chat는 공개 식별 필드만 사용한다.
- join event는 필수 `roomSlug`, `timestamp`를 검증하고 `room.access-denied`만 처리한다.
- `user.session-replaced`를 받은 해당 방은 재접속하지 않고 지정 문구를 표시한다.
- thumbnail/track image nullable 계약을 반영한다.
- 진단용 참가자 REST polling과 OAuth hard navigation은 제거한다.
- `npm run lint`, `npm run test`, `npm run build`, fresh QA가 통과한다.

## Progress

- [x] 브랜치 생성
- [x] 실행 계획 생성
- [x] API/타입 변경
- [x] queue UI/상태 변경
- [x] session replacement 변경
- [x] 잘못된 진단 코드/문서 정리
- [x] targeted/full QA
- [x] 기능 단위 commit
- [x] push/Draft PR

## Residual Risk

- 실제 동일 계정 다중 창 session replacement는 backend v26.8.0 환경이 필요하다.
- stacked branch이므로 v26.7.1 Draft PR의 병합 순서에 의존한다.
