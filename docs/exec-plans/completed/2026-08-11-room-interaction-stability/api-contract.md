# API Contract

## ROOM_OWNER_CHANGED

- `data.previousOwner`: 이전 방장 또는 `null`
- `data.owner`: 새 방장 또는 `null`
- 새 방장을 기존 room meta 캐시에 즉시 병합하고 room meta를 재조회한다.

## ROOM_INFO_UPDATED

- `data.title`, `data.hasPassword`, `data.maxParticipants`, `data.tags`만 전달된다.
- 제공된 필드만 room meta에 즉시 병합한다.
- room meta와 방 목록 캐시를 재검증한다.
