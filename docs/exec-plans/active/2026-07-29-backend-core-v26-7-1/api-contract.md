# API Contract

## Music Power

- Vote: `"UPVOTE" | "DOWNVOTE"`
- User:
  - `GET /api/v1/user-profiles/{userSlug}/music-power`
  - `PUT .../music-power` body `{ vote }`
  - `DELETE .../music-power`
- Current requester:
  - `PUT /api/v1/rooms/{roomSlug}/current-track/music-power` body `{ vote }`
  - `DELETE /api/v1/rooms/{roomSlug}/current-track/music-power`
- Response includes `musicPower` and nullable `myVote`.

## Badge

- Catalog identity: `badgeCode`; fields include `tier`, `active`, `acquired`.
- Acquired identity: `badgeCode`; fields include `representative`, `acquiredAt`.
- Representative payload: `{ badgeCode }`.
- No image fallback is defined by backend-core v26.7.1.

## Room Reads

- Playback: `GET /api/v1/rooms/{slug}/playback`
- Participants: cursor pages from `GET /api/v1/rooms/{slug}/participants`
- Queue: cursor pages from `/playlist` and `/playlist/me`
  - first: `size=100`
  - next: `cursor`, same response's `queueRevision`, `size=100`
  - `room.queue-mutation-conflict`: restart from first page once
- History: `GET /api/v1/rooms/{slug}/queue-history?cursorId=...&size=100`

## Removed

- `QueueEntry.track.regionRestriction`
- user search `musicPower`, `queuingCount`
- existing room thumbnail `PUT/DELETE`

## Rate Limit

- Parse `Retry-After` delta seconds and HTTP-date into `retryAfterMs`.
- GET/query 429: at most two retries, delay `max(retryAfterMs, exponentialBackoff)`.
- ordinary 4xx and mutations: no automatic retry.
- React Query does not retry exhausted 4xx/429 responses, but preserves up to three retries for network/5xx query failures.

## Room WebSocket Session

- The app-scoped STOMP transport and a room participant session are separate states.
- An active but disconnected client waits for the next `onConnect`; the room connect timeout must be longer than the 5-second broker reconnect delay.
- Every reconnected socket repeats `/app/room/{slug}/join` with the stored password before restoring room/chat topic subscriptions.
- Route exit and a cancelled published join send `/app/room/{slug}/leave`.
