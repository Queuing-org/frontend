# UI Flow

## Queue

`history query -> useRoomQueuePanel derived historyEntries -> RoomQueueHistoryList`

- 현재곡 `entryId`는 타임라인 경계에서 별도로 렌더하므로 history 파생 배열에서 제외한다.
- 전체/내 노래 필터 뒤에 동일한 dedupe 규칙을 적용한다.

## Add Track

- URL field 다음 형제가 story field이면 40px.
- URL field 다음에 playlist fieldset이 있으면 fieldset 자체 간격은 유지하고 fieldset 다음 story field 간격을 40px.

## Room Self Modals

- `RoomPlaybackJoinedContent`가 방 내부 호출 문맥을 소유한다.
- SettingsModal/FollowModal은 `dimBackdrop` 표현 옵션을 받고 방 호출부에서만 활성화한다.
- modal open/close local state와 홈/검색 동작은 변경하지 않는다.

## Modal Size and Profile Padding

- desktop Friends/Settings modal은 540px 기준 높이를 사용하며 viewport보다 클 때만 줄어든다.
- Friends profile body에는 일반 16px, compact 12.8px의 상단 패딩을 적용해 기존 80% density 규칙을 유지한다.
