# UI Flow

## 전체 트랙

- `useRoomQueuePanel`이 playback origin을 해석해 자동 순환 현재곡을 일반 current entry에서 제외한다.
- `RoomQueuePanelView`는 자동 순환 상태 flag를 list section에 전달한다.
- list section은 현재곡 카드 대신 3개 막대 아이콘과 `현재 자동 재생 중입니다` 상태를 표시한다.
- 자동 재생 아이콘은 59x59px 원, 내부 padding 12px, 3px 막대 세 개를 사용한다.
- 지난 곡 또는 대기곡이 있으면 그대로 유지하며 자동 순환 상태는 history/current/pending 경계에 표시한다.
- list area는 size query container이며 자동 순환 상태는 history/pending 유무와 관계없이 `100cqh`로 현재 목록 viewport 한 화면을 차지한다.
- current boundary가 viewport 상단에 정렬되면 자동 순환 아이콘·문구는 해당 화면의 세로·가로 중앙에 오고, history는 위·pending은 아래에 유지된다.

## 내 노래

- 자동 순환은 사용자 신청곡이 아니므로 현재곡과 전용 상태를 모두 숨긴다.
- 기존 사용자 요청 history/current/pending 필터는 유지한다.

## Accessibility

- 상태 컨테이너는 `role=status`로 읽힌다.
- 장식 막대는 접근성 트리에서 숨긴다.
- `prefers-reduced-motion: reduce`에서는 애니메이션을 중지한다.
