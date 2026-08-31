# API Contract

## Queue history

- `GET /api/v1/rooms/{normalizedSlug}/queue-history`
- header: `X-Room-Access-Token`, query key에는 token 제외
- query: 첫 페이지도 `size=100`; 다음 페이지는 숫자 `cursorId`와 `size=100`
- every request forwards React Query `AbortSignal`
- response: `ApiResponse<{ items, hasNext, nextCursor }>` unwrap
- entry: numeric `id`, flat track metadata, timing fields, and `playbackOrigin: USER_REQUESTED | AUTOMATIC_REPLAY`
- backend page/item order is newest-first; selector exposes oldest-first
- 내 노래 탭은 `playbackOrigin=USER_REQUESTED`이면서 응답의 nullable `addedByUserSlug`와 현재 사용자의 공개 slug가 정확히 일치하는 항목만 소비하며, nickname이나 숫자 ID로 대체하지 않는다.
- `hasNext=false`, missing cursor, or an already requested cursor stops pagination
- TanStack infinite query stores at most 5 pages and reset returns to the newest first page

## Cache lifecycle

- `TRACK_STARTED`, `TRACK_ENDED`, and direct skip reset `roomQueueHistory(slug)` to its first page.
- successful initial join/reconnect resets history from the joined screen effect, after the newest room access token has been rendered into the query function.
- room deletion, kick, and `user.session-replaced` remove the history cache with the other room-internal caches.
- queue history has its own key so ordinary queue add/remove/reorder does not discard the user's history window.
