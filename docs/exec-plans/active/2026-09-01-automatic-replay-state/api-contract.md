# API Contract

## Room playback

- endpoint: `GET /api/v1/rooms/{slug}/playback`
- authoritative field: `currentEntry.status.playbackOrigin`
- values:
  - `USER_REQUESTED`: 기존 현재곡 카드 노출
  - `AUTOMATIC_REPLAY`: 현재곡 카드 제외 및 자동 순환 상태 노출
- queue/history 항목에는 status origin이 없을 수 있으므로 `PlaylistEntryStatus.playbackOrigin`은 optional로 모델링한다.

## Realtime cache

- `TRACK_STARTED` 이벤트 자체에는 playback origin이 없다.
- 같은 entry를 갱신할 때 기존 playback cache의 `status.playbackOrigin`을 보존한다.
- 새 entry의 출처는 예약된 playback query invalidation 뒤 REST 응답이 확정한다.
