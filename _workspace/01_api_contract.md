# API Contract Notes

## Stable Helpers

- `unwrapApiResponse` owns `ApiResponse<T>` envelope unwrapping.
- `assertApiBooleanResult` converts false boolean API results into `ApiError`.
- `buildRoomPasswordHeaders` returns `X-Room-Password` only when `password` is truthy.
- `buildRoomPasswordSubscriptionHeaders` wraps the same password header contract for STOMP subscriptions.

## Query Keys

The new key factories keep the existing query key shapes:

- `roomKeys.all()` -> `["rooms"]`
- `roomKeys.meta(slug)` -> `["roomMeta", slug]`
- `playlistKeys.roomQueue(slug, password, offset, size)` -> `["roomQueue", slug, password ?? null, offset, size]`
- `playlistKeys.roomQueuePrefix(slug)` -> `["roomQueue", slug]`
- `playlistKeys.roomState(slug, password)` -> `["roomState", slug, password ?? null]`
- `userKeys.me()` -> `["me"]`
- `followKeys.followers(lastId, size)` -> `["follows", "followers", lastId ?? null, size ?? null]`

## Password Boundary

- REST protected room requests use `buildRoomPasswordHeaders`.
- STOMP subscriptions use `buildRoomPasswordSubscriptionHeaders`.
- STOMP publish calls keep payload-only behavior and do not add password headers.
