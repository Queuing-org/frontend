# Review Findings

## Resolved actionable

1. 자동 재생 원형 아이콘이 화면 기준보다 크다.
   - 현재: 기본 80x80, compact 64x64, 막대 기본 4px/compact 3.2px
   - 요구: 원 59x59, 내부 padding 12px, 막대 width 3px
2. 자동 재생 전용 빈 상태가 목록 영역 세로 중앙에 오지 않는다.
   - 원인: `min-height: 100%`만 사용해 flex로 계산된 scroll area의 실제 높이를 채우지 못한다.
   - 수정: standalone 상태가 scroll area의 definite height를 채우도록 `height: 100%`를 사용한다.

## QA finding

- 최초 회귀 테스트가 dnd-kit live region과 자동재생 상태의 중복 `role=status`를 전역 조회해 실패했다.
- 자동재생 문구에서 가장 가까운 status 컨테이너로 조회 범위를 좁혔다.
- 독립 targeted 2 files / 17 tests와 diff-check 재검증 결과 pass.

## Superseded attempt

3. `height: 100%` 후속 수정 뒤에도 자동 재생 상태가 세로 중앙에 오지 않는다.
   - 사용자 runtime screenshot으로 동일 현상을 재현했다.
   - 원인: flex로 계산된 scroll area 안에서 자식의 percentage height가 콘텐츠 높이를 벗어나지 못했다.
   - 시도: 자동 재생 단독 상태일 때만 list area를 column flex container로 만들고 상태를 `flex: 1`로 채웠다.
   - 폐기 이유: runtime에서는 history가 존재해 단독 상태 조건이 false였고 중앙 정렬이 적용되지 않았다.

## Operational

- `gh auth status`에서 활성 계정 token 만료를 확인했다.
- 로컬 구현·검증·커밋은 가능하며, push와 PR 갱신 가능 여부는 Git credential을 별도로 확인한다.

## Resolved after runtime screenshot

4. parent flex 후속 수정 뒤에도 자동 재생 상태가 세로 중앙에 오지 않는다.
   - 실제 원인: history가 있으면 `RoomQueueListSection`이 자동 재생 상태를 `fillAvailableSpace=false`로 렌더링한다.
   - history는 현재 경계 위로 스크롤되어 screenshot에 보이지 않지만 해당 분기 때문에 상태는 intrinsic height만 차지한다.
   - 수정: list area를 size query container로 만들고 자동 재생 상태를 모든 timeline 분기에서 `100cqh`로 채운다.
   - 검증: 독립 targeted 4 files / 38 tests, lint, build, diff-check, fresh QA pass.
