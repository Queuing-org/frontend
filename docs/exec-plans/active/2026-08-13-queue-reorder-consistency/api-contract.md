# API Contract

- 이동 API와 payload는 변경하지 않는다.
  - `movedEntryId`
  - `beforeEntryId`
- `orderedPendingEntryIds`는 여전히 UI optimistic cache 적용용이며 API payload에는 포함하지 않는다.
- 이동 성공 후 `roomQueue` prefix를 reset하여 전체/내 신청곡과 infinite pages를 함께 서버 순서로 맞춘다.
- 이동 실패 시 snapshot을 복구한 뒤 같은 prefix를 reset해 최종 순서를 재확인한다.
- 같은 room-read scope의 mutation·realtime refresh는 75ms 동안 병합하되, 실행 중 같은 key 요청이 추가되면 revision을 높여 후속 refresh를 보장한다.
