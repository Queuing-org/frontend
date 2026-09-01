# QA Report

## Automated verification

- targeted Vitest: 5 files / 35 tests pass
  - playback API 응답의 nested playback origin
  - 같은 현재곡의 `TRACK_STARTED` origin 보존
  - queue panel의 전체/내 탭 자동 순환 분기
  - 자동 순환 상태·현재곡 카드 제외·manual timeline 보존
  - panel view flag 전달
- `npm run lint`: pass
- `npm run test`: 152 files / 649 tests pass
- `npm run build`: pass
- `git diff --check`: pass

## Fresh read-only QA

- result: pass
- independent targeted verification: 7 files / 58 tests pass
- findings: blocker 없음
- reviewed boundaries: playback origin, realtime cache, 전체/내 탭, history/pending/manual current, 상태 접근성·reduced motion, 칭호 선택 표현

## Visual QA

- in-app Browser와 외부 browser 연결을 조회했으나 사용 가능한 browser가 없어 실제 화면 캡처 확인은 수행하지 못했다.
- CSS의 기본/compact 크기와 `prefers-reduced-motion` 규칙, DOM의 `role=status`와 장식 아이콘 숨김은 코드와 테스트로 확인했다.

## Residual risk

- 실제 방에서 backend가 `AUTOMATIC_REPLAY`를 반환하는 통합 흐름과 패널 높이별 중앙 정렬은 게시 후 브라우저에서 확인이 필요하다.

## Visual follow-up

- 사용자 runtime screenshot에서 원형 아이콘 과대 크기와 빈 상태 상단 치우침을 확인했다.
- 원 59x59px, padding 12px, 막대 width 3px을 기본/compact 구간에서 동일하게 유지한다.
- standalone 상태에만 `height: 100%`를 적용하고 timeline 상태에는 기존 min-height를 유지한다.
- targeted Vitest: 2 files / 17 tests pass
- lint: pass
- build: pass
- diff-check: pass
- fresh QA: DnD live-region selector finding 1건 수정 후 2 files / 17 tests 및 diff-check pass
- 수정 후 실제 브라우저 screenshot은 현재 세션에서 확인하지 못했다.

## Superseded parent-owned centering follow-up

- 사용자 runtime screenshot에서 자식 `height: 100%`가 콘텐츠 높이만 차지해 중앙 정렬에 실패함을 확인했다.
- 자동재생 단독 상태일 때 list area를 column flex container로 만들고 standalone 상태를 `flex: 1`로 배치했다.
- 로컬 검증은 통과했지만 실제 runtime에는 화면 위 history가 존재해 단독 상태 조건이 false였고 중앙 정렬이 적용되지 않았다.
- 해당 조건부 flex 구현은 다음 follow-up에서 제거했다.

## List viewport height follow-up

- list area를 size query container로 지정했다.
- no-history와 timeline 분기 모두 자동재생 상태에 `fillAvailableSpace=true`를 전달한다.
- 자동재생 상태는 `100%` fallback 뒤 `100cqh`로 list viewport 한 화면 높이를 차지한다.
- history는 위, pending은 아래에 유지되고 current boundary를 상단 정렬하면 아이콘·문구가 현재 list viewport 중앙에 온다.
- targeted Vitest: 2 files / 17 tests pass
- lint: pass
- build: pass
- diff-check: pass
- fresh QA: 4 files / 38 tests pass
- residual: jsdom은 container query unit의 실제 layout을 계산하지 않는다.
