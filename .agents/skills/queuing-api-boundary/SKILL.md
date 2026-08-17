---
name: queuing-api-boundary
description: Verify and implement queuing-org API clients, hooks, payloads, cache invalidation, and API/UI contract boundaries.
---

# Queuing API Boundary

## When to Use

Use this skill when a task touches:

- `src/features/*/api/*` and domain-specific API clients nested under `src/features`
- React Query hooks or mutation invalidation
- request payloads, response typing, headers, or `ApiResponse<T>` unwrapping
- room password, slug normalization, playlist queue, room update, friend, auth, user, or search endpoints
- troubleshooting involving HTTP status codes, API docs, or network logs

Do not use it for purely visual CSS changes with no data flow.

## Required Inputs

- endpoint path or API docs URL when available
- current client function, hook, and consuming UI files
- observed request/response, error log, or browser network evidence when troubleshooting
- expected cache updates and UI state after success or failure

## Workflow

1. Read the endpoint client, hook, type definitions, and consuming component together.
2. Compare API docs or observed response shape to the feature's co-located types or `model/types.ts`.
3. Check shared conventions:
   - use `axiosInstance`
   - unwrap `ApiResponse<T>` consistently
   - throw `ApiError` for failed `result` values
   - normalize room slugs with `normalizeRoomSlug`
   - use a JSON `password` only for the first room join
   - after `ROOM_JOINED`, include `X-Room-Access-Token` on room-internal REST requests and authenticated room topic subscriptions
4. For mutations, list every query key that must be invalidated or optimistically updated.
5. For PATCH requests, send only fields with a clear user intent. Do not send UI-only fields or unknown existing secrets.
6. For troubleshooting, separate confirmed facts from hypotheses. A 500 is server failure behavior; client payload ambiguity should be documented as a defensive frontend fix, not overstated as the root cause unless reproduced.
7. Write `docs/exec-plans/active/{run}/api-contract.md` for large or risky changes.

## Project-Specific Rules

- Room update payloads should avoid unknown existing secrets: never send `password: ""` to mean "keep password".
- Room update `PATCH /api/v1/rooms/{slug}` accepts optional fields; send only fields that actually changed, including `title` only when its value changed.
- Empty password strings are ambiguous unless the API explicitly documents them as "clear password".
- Queue mutations must refresh `roomQueue`; playback changes must consider `roomPlayback`, and participant changes must consider `roomParticipants`.
- A connected global STOMP client is not proof that the current socket session joined a room. Subscribe to `/user/playlist/events`, then join with the password on first entry or the saved `roomAccessToken` on reconnect. Restore authenticated room/chat topic subscriptions and room reads only after the current socket receives `ROOM_JOINED`.
- The current backend broker does not acknowledge a STOMP `SUBSCRIBE` receipt. Subscribe to `/user/playlist/events` before publishing room join and do not add arbitrary timing delays. Retry only for an explicit backend contract: `room.already-participating` keeps the same socket session lease open while the user decides, then confirmation republishes exactly the original target slug and credential on that connection. The first conflict must not publish target leave, and malformed conflict data without both existing-room `slug` and `title` must not open the confirmation dialog.
- App-wide `/user/queue/follow-presence` and room membership use dedicated clients because their ownership and reconnect lifecycles differ. Do not claim this separation fixes a room join failure unless the same authenticated account and backend state are controlled in the comparison.
- Store `roomAccessToken` only in memory or room-scoped `sessionStorage`. Never put it in a URL, log, or TanStack Query key. A WebSocket close is reconnectable and must not clear the token. Clear it after an explicit successful leave and on `room.access-denied`, kick, session replacement, or room deletion.
- Room route exit and a cancelled in-flight join must publish `/app/room/{slug}/leave` while the socket is connected. Do not rely on component subscription cleanup to remove the backend participant session. A transport close is not an explicit leave.
- Queue reads are infinite pages. Fetch the first page with `size`, send only the opaque `cursor` for later pages, retain response `queueRevision` and `totalPendingCount`, and reset to the first page on `room.queue-update-conflict`.
- Playlist entry status uses `ownerOrdered` as display-only server state. Personal reorder PATCH targets and optimistic order must include every pending personal entry regardless of that value; do not restore the removed `ownerOrderLocked` or `room.queue-entry-order-locked` contract.
- `user.session-replaced` permanently stops reconnect for that room client instance, clears its room token, and does not stop the app-wide follow presence client.
- Playlist item operations use `entryId`, not track video id.
- Public identity is slug-based: chat uses nullable `senderSlug`, requesters use nullable `addedBy.slug`, owners use `owner.slug`, and participants use `userSlug` plus `participantId`. Do not fall back to numeric IDs or nicknames.
- Chat send confirmation is driven by `CHAT_MESSAGE`, but if that real-time event is missed, backfill the latest chat history before requiring a manual refresh.
- Room list/meta `thumbnailUrl(s)` represent the current track image. Prefer the server image and use the local empty-room image only when the server returns no thumbnail.
- Every cancellable TanStack GET query must pass `QueryFunctionContext.signal` through the API client and every cursor-page request. Calling `cancelQueries` without transport-level signal propagation is not cancellation.

## Outputs

- updated API client, hook, types, or consuming component
- query invalidation notes
- `docs/exec-plans/active/{run}/api-contract.md` for complex work
- incident candidate when a reusable API failure is discovered

## Validation

- The request payload matches the user's actual intent.
- Response typing matches the consuming UI shape.
- Related query keys are invalidated or optimistically updated.
- Errors surface actionable messages without hiding server failures.
- `npm run lint` and `npm run build` pass for code changes unless the user explicitly skips them.
