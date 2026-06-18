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

## Room Thumbnail Upload

- `PUT /api/v1/rooms/{slug}/thumbnail` replaces the room thumbnail; the client does not call a delete endpoint.
- The request body is `multipart/form-data` with the selected file appended under field name `file`.
- Slugs are normalized with `normalizeRoomSlug` before URL encoding.
- The upload client follows the existing `ApiResponse<T>` convention and currently treats `result: boolean` as the success contract.
- Upload success invalidates:
  - `roomKeys.all()` so home/search room cards can receive the new `thumbnailUrl`.
  - `roomKeys.meta(slug)` so the room detail/edit modal can receive the new `thumbnailUrl`.

## Thumbnail Response Shape

- `RoomMeta` accepts `thumbnailUrl`, `thumbnailUrls`, `maxParticipants`, and `trackLimitMinutes`.
- `Room` accepts optional `thumbnailUrl` and `thumbnailUrls` for list responses.
- Home/search list thumbnails still use the existing default image fallback when the list API omits `thumbnailUrl`.
