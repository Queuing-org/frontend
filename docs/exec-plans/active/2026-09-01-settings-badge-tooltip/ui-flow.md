# UI Flow

## Ownership

- `ProfileSettingsTab`은 조회 결과를 selector option으로 전달하고 기존 설정/해제 mutation 및 알림을 소유한다.
- 설정 feature의 badge selector는 open, active option, keyboard tooltip, hover tooltip, portal layout 상태만 로컬로 소유한다.
- server state를 local state로 복제하지 않고 선택값은 query에서 계산된 `badgeValue`를 그대로 사용한다.

## Interaction

- trigger는 select-only combobox semantics를 사용하고 portal listbox의 active option을 `aria-activedescendant`로 연결한다.
- ArrowUp/ArrowDown과 Home/End는 active option을 이동하고, Enter/Space는 열기 또는 선택, Escape는 닫기를 수행한다.
- pointer hover는 해당 획득 칭호 tooltip을 표시하며 pointer-only open에는 모바일 전용 tooltip tap 동작을 추가하지 않는다.
- option 선택과 Escape 후 DOM focus는 trigger에 유지된다. 바깥 pointer/focus 이동은 목록을 닫되 새 focus target을 가로채지 않는다.
- listbox와 tooltip은 `document.body` portal에 fixed positioning으로 렌더링한다.
- tooltip은 option 옆 기본 오른쪽 배치 후 viewport 공간이 부족하면 왼쪽으로 전환한다.
