# backend hotfix/260812 프론트엔드 전환

## Scope

- 백엔드 `c91f8a` 계약이 배포됐다는 전제로 deprecated fallback 없이 새 REST/실시간 계약으로 전환한다.
- 공통 에러, 온보딩 제거, 방 REST/cursor, 실시간 종료·채팅 삭제, 사용자 관계·무한 목록을 함께 정합화한다.
- `dev`를 PR #48 병합 커밋 `275c5aa`로 fast-forward한 상태에서 구현하고 `main` 대상 새 Draft PR로 전달한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-incident-curator`
- `queuing-qa-reviewer`

## Ownership

- REST envelope/error normalization: `src/shared/api`
- 인증 callback과 route assembly: `src/features/auth`, `src/app`
- room API/query/realtime/local cleanup: `src/features/room`
- follow/block/badge/music-power API와 cache: 각 feature query hook
- 무한 목록 loading/error/focus: 검색 및 follow 목록 feature hook/UI
- 삭제 방 1회성 알림: 홈 feature의 sessionStorage 기반 local UI state

## Commit Slices

1. `fix(api): hotfix 에러 계약과 온보딩 제거 반영`
2. `fix(room): 새 REST 경로와 cursor 계약 반영`
3. `fix(realtime): 방 메타와 종료·채팅 삭제 동기화`
4. `fix(user): 관계 API와 cursor 목록 전환`
5. `docs(delivery): hotfix 전환 검증 기록`

## Acceptance Criteria

- 사용자 제공 계획의 API·상태·실시간·UI·검증 항목을 deprecated fallback 없이 충족한다.
- 새 계약과 충돌하는 저장소 스킬/아키텍처 설명을 함께 갱신한다.
- targeted test, `npm run lint`, `npm run test`, `npm run build`, `git diff --check`와 fresh QA를 통과한다.
- `dev`를 push하고 `main` 대상 한국어 Draft PR을 생성한다.

## Progress

- [x] `dev`를 PR #48 병합 커밋으로 fast-forward
- [x] 실행 계획 생성
- [x] API/온보딩 변경
- [x] room REST/cursor 변경
- [x] realtime/UI 변경
- [x] user relationship/infinite-list 변경
- [x] 문서/incident 정리
- [x] targeted/full QA
- [x] 기능 단위 commit
- [ ] push/Draft PR

## Residual Risk

- 실제 backend hotfix 환경의 2브라우저 수동 검증은 접근 가능한 배포 URL과 인증 세션에 의존한다.
- 확인한 backend `c91f8a` 구현은 큐 후속 요청에서 `cursor`와 `queueRevision` 동시 전송을 검사하지만 요청 계획은 `queueRevision` 제거를 명시한다. 배포 계약이 코드와 같다면 큐 pagination이 `invalid-input`으로 실패하므로 backend 확인 전 merge를 차단해야 한다.
