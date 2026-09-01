# UI Flow

## 전체 트랙

- `useRoomQueuePanel`이 playback origin을 해석해 자동 순환 현재곡을 일반 current entry에서 제외한다.
- `RoomQueuePanelView`는 자동 순환 상태 flag를 list section에 전달한다.
- list section은 현재곡 카드 대신 3개 막대 아이콘과 `현재 자동 재생 중입니다` 상태를 표시한다.
- 지난 곡 또는 대기곡이 있으면 그대로 유지하며 자동 순환 상태는 history/current/pending 경계에 표시한다.
- 다른 항목이 없으면 자동 순환 상태가 목록의 중앙 빈 상태를 대신한다.

## 내 노래

- 자동 순환은 사용자 신청곡이 아니므로 현재곡과 전용 상태를 모두 숨긴다.
- 기존 사용자 요청 history/current/pending 필터는 유지한다.

## Accessibility

- 상태 컨테이너는 `role=status`로 읽힌다.
- 장식 막대는 접근성 트리에서 숨긴다.
- `prefers-reduced-motion: reduce`에서는 애니메이션을 중지한다.
