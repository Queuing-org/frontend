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
   - include `X-Room-Password` only when a protected room request needs it
4. For mutations, list every query key that must be invalidated or optimistically updated.
5. For PATCH requests, send only fields with a clear user intent. Do not send UI-only fields or unknown existing secrets.
6. For troubleshooting, separate confirmed facts from hypotheses. A 500 is server failure behavior; client payload ambiguity should be documented as a defensive frontend fix, not overstated as the root cause unless reproduced.
7. Write `docs/exec-plans/active/{run}/api-contract.md` for large or risky changes.

## Project-Specific Rules

- Room update payloads should avoid unknown existing secrets: never send `password: ""` to mean "keep password".
- Room update `PATCH /api/v1/rooms/{slug}` currently rejects password-only payloads with `400 invalid-input`; when any room update is sent, include the current non-empty `title` alongside changed `tags` or `password`.
- Empty password strings are ambiguous unless the API explicitly documents them as "clear password".
- Queue mutations must refresh `roomQueue`; playback changes must consider `roomPlayback`, and participant changes must consider `roomParticipants`.
- A connected global STOMP client is not proof that the current socket session joined a room. After every reconnect, repeat `/app/room/{slug}/join` before restoring room topic subscriptions and invalidating room reads.
- The current backend broker does not acknowledge a STOMP `SUBSCRIBE` receipt. Subscribe to `/user/playlist/events` before publishing room join, but do not add timing delays or retry join without an idempotency contract.
- App-wide `/user/queue/follow-presence` and room membership use dedicated clients because their ownership and reconnect lifecycles differ. Do not claim this separation fixes a room join failure unless the same authenticated account and backend state are controlled in the comparison.
- Room route exit and a cancelled in-flight join must publish `/app/room/{slug}/leave` while the socket is connected. Do not rely on component subscription cleanup to remove the backend participant session.
- Queue reads are infinite pages. Fetch the first page with `size`, pair every next `cursor` with that page's `queueRevision`, display `totalPendingCount`, and reset to the first page on `room.queue-mutation-conflict`.
- `user.session-replaced` permanently stops reconnect for that room client instance without stopping the app-wide follow presence client.
- Playlist item operations use `entryId`, not track video id.
- Public identity is slug-based: chat uses nullable `senderSlug`, requesters use nullable `addedBy.slug`, owners use `owner.slug`, and participants use `userSlug` plus `participantId`. Do not fall back to numeric IDs or nicknames.
- Chat send confirmation is driven by `CHAT_MESSAGE`, but if that real-time event is missed, backfill the latest chat history before requiring a manual refresh.
- Public room card images are currently frontend defaults. Do not assume the backend provides a representative image until the API adds it.

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
