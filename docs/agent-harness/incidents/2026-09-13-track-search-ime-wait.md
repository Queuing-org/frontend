# 한글 조합 종료를 기다리던 노래 제목 자동 검색

## Problem

사용자는 제목 검색이 엔터 없이 계속 검색 중으로 남고 엔터 후 약 0.5초 내 끝난다고 보고했다.

## Previous Behavior

TrackSearchInput은 compositionstart/end를 state와 ref로 보관했다. useTrackSuggestions는 그 state가 참이면 검색어를 빈 문자열로 디바운스하고 요청을 비활성화하면서 loading은 참으로 반환했다.

## Previous Code

```ts
const debouncedQuery = useDebouncedValue(composing ? "" : input.query, 300);
const enabled = Boolean(userSlug) && open && !composing;
// loading: composing || debouncePending || query.isFetching
```

## Updated Code

```ts
const debouncedQuery = useDebouncedValue(input.query, 300);
const enabled = Boolean(userSlug) && open;
// compositionRef/nativeEvent.isComposing/keyCode 229 still guard keyboard selection.
```

## Problem in the Previous Code

입력값이 더는 변하지 않아도 마지막 한글이 조합 중이면 compositionend가 오지 않을 수 있다. 자동 조회를 조합 종료 이벤트에 종속시키면 실제 요청 없이 검색 중 UI가 무기한 유지된다. Enter 선택 방어와 읽기 전용 자동 조회에 같은 차단 조건을 사용한 것이 문제다.

## Evidence

- compositionStart → 한국어 change → 400ms 경과 시 이전 코드는 새 검색을 호출하지 않는다.
- 50ms 간격 40회 change 후 300ms 유휴 시 이전 코드는 검색 0회, 수정 후 1회.
- 이전 코드에서 회귀 2건 실패를 확인한 뒤 수정했다.
- 수정 후 compositionend/Enter 없이 결과가 표시되고 60초 유휴에도 총 검색 1회다.
- 활성 결과가 있어도 조합 중 Enter(native flag 및 composition ref)는 URL 선택을 하지 않는다.
- 기존 URL 차단, 역순 응답 무시·취소, 계정 분리, quota 실패 테스트를 유지한다.
- 네트워크는 API 함수 mock을 사용했다. 실제 사용자 OS IME와 운영 API 응답 시간은 관측하지 않았다.

## Cause or Remaining Hypotheses

조합 상태에서 요청을 차단하고 무기한 loading을 표시하는 프런트 경로는 재현으로 확인했다. 사용자 환경의 실제 이벤트 순서와 엔터 후 약 0.5초의 서버 응답 시간은 미확인이다. 서버가 느리다고 단정하지 않는다.

## Solution Options

- compositionend만 기다리기: 현재 증상을 유지하므로 제외.
- 조합 ref를 타이머로 강제 해제하기: 조합 중 Enter의 의도치 않은 선택 위험 때문에 제외.
- 입력값 디바운스와 키보드 조합 방어 분리: 선택.

## Chosen Solution and Rationale

자동 조회는 300ms 값 안정화로 실행하고 조합 ref는 키보드 동작에만 사용한다. 기존 cache/AbortSignal/오류 및 URL 분류를 유지하는 작은 변경이다. 조합 도중 300ms 이상 쉬면 미완성 검색어로도 요청될 수 있다는 절충은 있으며 연속 입력은 한 요청으로 합친다.

## Result

조합 종료/엔터 없이도 마지막 입력의 결과를 받을 수 있다. 고정된 네트워크 완료 시간을 보장하는 변경은 아니다.

## Reusable Rule

라이브 검색은 입력 정지에 반응하고, IME 조합 상태는 키보드 제출/선택 방어에 사용한다. 테스트에서 compositionend를 생략해 무기한 대기를 검증한다.

## Skill or Team Spec Updates

- `.agents/skills/queuing-ui-flow/SKILL.md`에 조합 종료 없는 자동 검색과 유휴 요청 상한 검증 규칙을 추가했다.

## Verification

- targeted: 2 files / 9 tests passed.
- 전체 lint/test/build 및 독립 QA 결과는 `docs/exec-plans/active/2026-09-13-profile-search-fix/qa-report.md`에 기록한다.
- Browser runtime bootstrap과 discovery 결과 연결 가능한 브라우저 없음. 실제 화면·OS IME 검증은 미실행.
