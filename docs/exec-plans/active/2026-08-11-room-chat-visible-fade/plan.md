# 현재 곡 너비·참가자 여백·채팅 가시 블러 개선

## Scope

- 방장에게만 노출되는 `SKIP` 영역을 제외한 현재 곡 정보의 가로 공간을 모두 사용한다.
- 참가자 모달 크기는 유지하고 목록과 카드의 좌우 여백만 줄인다.
- 채팅 상단을 강한 blur와 약한 blur의 고정된 2개 영역으로 나눠, 스크롤 중 메시지별 상태 교체 없이 해당 영역 안의 내용을 모두 처리한다.
- 테스트 코드는 추가하거나 수정하지 않고 `dev`에 로컬 커밋까지만 만든다.

## Acceptance Criteria

- 방장은 `SKIP` 버튼과 겹치지 않는 범위, 비방장은 카드 끝까지 현재 곡 marquee 영역을 사용한다.
- 참가자 모달 외곽 크기와 메뉴 동작은 변하지 않는다.
- 채팅 상단 첫 영역은 강한 blur, 바로 아래 영역은 약한 blur, 나머지는 선명하게 보인다.
- 스크롤 중 메시지마다 blur 상태를 재계산하거나 React state를 갱신하지 않는다.
- 흰색 gradient와 mask는 사용하지 않는다.

## Progress

- [x] 관련 컴포넌트와 반응형 CSS 구조 확인
- [x] 현재 곡 영역과 참가자 여백 조정
- [x] 실제 가시 메시지 기반 2단계 blur 구현
- [x] lint, build, diff 검증
- [x] fresh read-only QA
- [x] 로컬 커밋
- [x] 사용자 후속 피드백에 따라 메시지 단위 blur 계산 제거
- [x] 상단 2단계 고정 blur 영역 구현
- [x] 후속 lint, build, diff 검증
- [x] 후속 fresh read-only QA
- [x] 후속 로컬 커밋

## Verification

- `npm run lint`
- `npm run build`
- `git diff --check`
- 테스트 파일 변경 여부 확인
- desktop/mobile/compact DOM·CSS 경계와 스크롤 재계산 정적 검토

## Delivery

- branch: `dev`
- push: 하지 않음
- PR: 만들거나 수정하지 않음

## Result

- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- fresh read-only QA: empty chat 이후 observer 연결 보완 후 pass
- 테스트 코드 변경·추가: 없음

## Follow-up

- 기존 메시지 단위 `getBoundingClientRect`/RAF/ResizeObserver/state 경로는 스크롤 중 blur 대상이 빠르게 교체되는 문제가 있어 제거한다.
- 반응형 채팅 변수로 한 단계 높이를 계산하고 상단 strong/soft 두 영역 안의 내용을 일괄 blur한다.
- 열린 메시지 행도 blur 영역을 벗어나지 않고, body portal의 관리 메뉴만 선명하게 유지한다.
- 모바일 직접 override 값은 blur 계산용 변수에도 동일하게 반영한다.
