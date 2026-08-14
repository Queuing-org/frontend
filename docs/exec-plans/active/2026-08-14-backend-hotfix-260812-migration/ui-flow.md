# UI Flow

- `ROOM_INFO_UPDATED`: validate `trackLimitMinutes`, apply event metadata immediately, fetch authoritative room metadata for thumbnail, invalidate discovery lists.
- `ROOM_DELETED` or reconnect `room.not-found`: unsubscribe, cancel pending invalidations/rejoin, clear playback/participant/queue/meta caches, password and chat/playback local state, then navigate home.
- Home consumes a session-scoped notice once, exposes `role=status`, dismisses manually or after five seconds.
- `CHAT_MESSAGE_DELETED`: retain a message-key tombstone and apply it to both loaded messages and later history; deleted messages are dimmed and cannot be reported or managed.
- Follow buttons use profile `relationship`. Search/follower/following lists de-duplicate slugs across cursor pages, auto-load at a sentinel, and expose bottom loading/retry state without replacing existing keyed rows.
