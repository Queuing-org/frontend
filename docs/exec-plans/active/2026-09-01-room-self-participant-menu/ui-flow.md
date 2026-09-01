# UI Flow

1. 참가자 목록은 로그인한 현재 사용자 행을 첫 번째로 파생 정렬한다.
2. 내 행 hover 또는 keyboard focus 시 기존과 같은 더보기 trigger가 나타난다.
3. trigger를 열면 `Setting`, `Friends` menuitem만 표시된다.
4. menuitem 선택은 menu를 닫고 방 화면의 단일 modal state를 갱신한다.
5. 방 화면은 draggable widget 밖에서 기존 `SettingsModal` 또는 `FollowModal`을 렌더링한다.
6. modal close는 room modal state를 `null`로 되돌린다.

## Ownership

- 정렬과 열린 참가자 menu: `RoomParticipantList`
- 참가자 행 trigger와 self/member menu 선택: `RoomParticipantCard`
- Settings/Friends modal visibility: `RoomPlaybackJoinedContent`
- modal 내부 tab/form/follow state: 기존 modal component
