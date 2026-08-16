# API Contract

## 회원 탈퇴

- 기존 `DELETE /api/v1/user-profiles/me`와 `WithdrawMeParams`를 변경하지 않았다.
- UI는 선택된 사유를 화면 순서대로 정렬한 뒤 줄바꿈으로 연결한다.
- 첫 단계에서 한 개 이상 선택해야 다음 단계로 갈 수 있으므로 mutation에는 항상 비어 있지 않은 `reason` 문자열을 전달한다.
- 성공 시 `useWithdrawMe`가 수행하던 me/profile/search/follow/badge cache 정리를 그대로 유지한다.

## 방장 승계

- WebSocket payload와 `ROOM_OWNER_CHANGED` 파서는 변경하지 않았다.
- room-meta cache가 갱신한 현재 사용자 방장 여부를 `RoomPlaybackJoinedContent`가 관찰한다.
- 최초 `roomMeta.owner.slug`는 기준값으로만 저장하고, 이후 owner slug가 실제로 현재 사용자 slug로 바뀐 경우에만 승계로 판단한다.
- `currentUser` 데이터만 뒤늦게 복구되어 파생 방장 여부가 바뀌는 경우는 승계로 취급하지 않는다.
