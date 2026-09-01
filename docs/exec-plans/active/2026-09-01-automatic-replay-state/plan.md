# 자동 순환 재생 상태와 칭호 굵기 정리

## Scope

- `/api/v1/rooms/{slug}/playback`의 `currentEntry.status.playbackOrigin`을 현재 재생 출처의 기준으로 사용한다.
- `AUTOMATIC_REPLAY` 현재곡은 전체 트랙의 일반 곡 카드에서 제외하고 애니메이션 상태로 안내한다.
- 지난 곡과 대기곡은 자동 순환 중에도 유지한다.
- 설정 칭호 선택기의 획득 칭호 전용 bold 규칙을 제거해 주변 입력 타이포와 통일한다.

## Acceptance Criteria

- `AUTOMATIC_REPLAY` 현재곡 제목과 현재 재생 카드는 전체 트랙에 렌더링하지 않는다.
- 전체 트랙에는 막대 3개가 움직이는 `현재 자동 재생 중입니다` 상태를 표시한다.
- 모션 감소 환경에서는 막대 애니메이션을 중지한다.
- 내 노래 탭에는 자동 순환 상태와 현재곡을 표시하지 않는다.
- 수동 재생 현재곡, 지난 곡, 대기곡, 큐 조작 동작은 유지한다.
- 같은 현재곡의 실시간 `TRACK_STARTED` 캐시 갱신에서 REST로 받은 playback origin을 보존한다.
- 칭호 옵션은 획득 여부와 무관하게 기존 trigger와 같은 medium 굵기를 사용한다.

## Selected Skills

- queuing-feature-delivery
- queuing-orchestrator
- queuing-api-boundary
- queuing-ui-flow
- frontend-architecture-guardrails
- queuing-qa-reviewer
- browser:control-in-app-browser

## Commit Slices

1. `fix(settings): 칭호 선택기 글자 굵기를 맞춤`
2. `feat(queue): 자동 순환 재생 상태를 표시`
3. `docs(delivery): 자동 재생 상태 게시 결과를 기록`

## Progress

- [x] 현재 branch/worktree와 Draft PR #58 확인
- [x] playback API, realtime cache, queue panel state ownership 확인
- [x] 칭호 굵기와 자동 순환 UI 구현
- [x] targeted/full local verification
- [x] fresh read-only QA
- [x] commit, push, Draft PR #58 갱신

## Verification

- targeted Vitest: playback API, realtime reducer, queue panel hook/view/list
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`
- fresh read-only QA

결과:

- targeted Vitest: 5 files / 35 tests pass
- lint: pass
- full test: 152 files / 649 tests pass
- build: pass
- git diff --check: pass
- fresh QA: 7 files / 58 tests 및 diff-check pass, blocker 없음
- browser visual QA: 브라우저 연결 없음으로 미실행

## Residual Risk

- 실제 backend 자동 순환 응답과 브라우저 높이별 중앙 정렬은 로컬 fixture 기준이다.
- 현재 세션에 연결된 브라우저가 없어 실제 화면 캡처 QA는 수행하지 못했다.

## Follow-up: visual size and alignment

- [x] 사용자 runtime screenshot으로 과도한 원 크기와 상단 치우침 재현
- [x] 원 59x59px, 내부 padding 12px, 막대 width 3px 적용
- [x] 자동재생 단독 상태가 list area의 실제 높이를 채우도록 `height: 100%` 적용
- [x] targeted 2 files / 17 tests, lint, build, diff-check 통과
- [x] fresh QA의 DnD live-region test selector finding 1건 수정 후 재검증 pass

## Superseded follow-up: parent-owned centering

- [x] 사용자 runtime screenshot으로 `height: 100%` 수정이 실제 중앙 정렬에 실패함을 재현
- [x] 자동재생 단독 상태의 parent flex 방식을 시도하고 로컬 검증
- [x] history가 존재하는 runtime에서 조건이 false가 되어 동작하지 않음을 후속 screenshot으로 확인
- [x] 조건부 parent flex 구현과 전용 테스트 제거

## Follow-up: list viewport height centering

- [x] history가 화면 위로 스크롤된 상태에서도 timeline branch가 존재함을 원인으로 확정
- [x] list area를 size query container로 지정
- [x] history/pending 유무와 관계없이 자동재생 상태를 `100cqh`로 렌더링
- [x] history branch도 `fillAvailableSpace=true`인지 회귀 테스트로 고정
- [x] targeted 2 files / 17 tests, lint, build, diff-check 통과
- [x] fresh QA 4 files / 38 tests pass
