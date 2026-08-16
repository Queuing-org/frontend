# UI Flow

## State Owners

- 랜덤 입장 오류 자동 제거: `useRandomEntryNavigation`
- 방 생성 기본값: create form hook
- 참여 제한 메뉴와 비밀번호 input focus: `CreateSettingsStep`
- 프로필 변경 여부와 저장 버튼 노출: profile settings form hook/view
- queue 내 노래 강조: queue panel의 기존 current-user slug 판별 결과를 전체 탭 카드까지 전달

## Interaction Rules

- hover-only 시각 요소인 방 따라가기는 `:focus-visible`에서도 동일한 tooltip을 보여준다.
- 참여 제한 컨트롤은 어느 지점을 클릭해도 메뉴가 열리고 password input 클릭은 focus를 잃지 않는다.
- 랜덤 입장 오류는 새 요청과 성공에서 즉시 지우고, 실패 후 3초 타이머와 unmount cleanup을 보장한다.
