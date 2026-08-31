# 재생목록 양방향 무한스크롤

## Scope

- 전체 탭을 과거곡 → 현재곡 → 대기곡의 시간순 목록으로 구성한다.
- 과거곡은 `queue-history`, 대기곡과 내 신청곡은 기존 cursor query를 스크롤 경계에서 한 페이지씩 조회한다.
- history 5페이지/500곡, 각 목록 DOM 40행 상한과 대기곡 한정 DnD를 유지한다.
- 곡 전환·재연결·종료 시 history 최신 창과 관련 캐시를 일관되게 갱신한다.
- 내 노래 탭에도 로그인 사용자가 신청한 history와 현재곡을 같은 시간축으로 노출한다.
- 지난 곡 카드는 현재 재생 카드와 같은 회색 배경으로 구분한다.

## Selected skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Acceptance criteria

- history API가 slug, access token, `cursorId`, `size=100`, AbortSignal 계약을 지킨다.
- 누락·반복 cursor를 중단하고 history 응답을 중복 제거한 시간순 최대 500곡으로 만든다.
- 전체 탭의 현재곡 앵커, 상단 prepend 보정, 하단 자동 조회, 방향별 실패/재시도가 동작한다.
- 내 신청곡 탭은 공개 slug가 일치하는 history/current만 노출하고 DnD 중에는 자동 조회하지 않는다.
- 전체/내 노래 양쪽에서 위로 과거곡, 아래로 대기곡 페이지를 조회한다.
- 지난 곡은 현재 재생 카드와 같은 `#f7f7f9` 배경을 사용한다.
- track 이벤트·직접 skip·재연결은 history를 첫 페이지로 reset하고 terminal cleanup은 history 캐시도 제거한다.
- `npm run test`, `npm run lint`, `npm run build`와 fresh QA review가 통과한다.

## Commit slices

1. `feat(playlist): 재생 기록 조회와 캐시 생명주기 추가`
2. `feat(queue): 재생목록 양방향 무한스크롤 적용`
3. `docs(delivery): 양방향 무한스크롤 게시 상태 기록`
4. `feat(queue): 내 노래 재생 기록 노출`

## Progress

- [x] 저장소·브랜치·기존 계약 확인
- [x] API/UI 경계 설계
- [x] API·query·lifecycle 구현
- [x] UI·스크롤·가상화 구현
- [x] targeted/full QA와 fresh review
- [x] commit, push, Draft PR
- [x] 내 노래 history 후속 구현과 회귀 QA

## Decisions

- React Query가 history 서버 상태와 5페이지 sliding window를 소유한다.
- queue panel hook이 탭, 조회 상태, mutation busy 상태를 조합하고 UI가 실제 scroll container와 anchor 보정을 소유한다.
- history/current는 정적 비-sortable 구간, pending queue만 기존 sortable 구간으로 둔다.
- 개인 history는 새 API를 추정하지 않고 기존 history 응답의 `playbackOrigin=USER_REQUESTED`, `addedByUserSlug`와 로그인 사용자의 공개 slug를 정확히 비교한다.

## Verification

- `npm run test -- --reporter=dot`: 152 files, 621 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- fresh read-only QA: `pass`; virtual geometry, stale anchor, retry, refetch busy, tail clamp findings closed
- manual browser QA: unavailable because the in-app browser had no connected runtime; no desktop/mobile/public/private claim is made
- delivery: `dev` pushed and Draft PR #57 opened against `main`
- follow-up targeted: room/playlist 26 files, 101 tests passed; final focused 2 files, 22 tests passed
- follow-up full QA: 152 files, 628 tests passed; lint passed; build passed; `git diff --check` passed
- follow-up fresh read-only QA: `pass`; 개인 필터, 짧은 목록 wheel, anchor/latch, DnD, 회색 상태 검토 완료

## Residual risk

- 실제 backend history payload와 데스크톱/모바일·공개/비공개 방의 브라우저 실측은 연결 가능한 runtime과 backend에서 후속 확인이 필요하다.
