# API Contract Notes

## Room Create Limits

- `POST /api/v1/rooms` payload now supports:
  - `maxParticipants?: number | null`
  - `trackLimitMinutes?: number | null`
- Create UI sends neither field when the input is empty.
- Non-empty values are sent only after local integer range validation:
  - `maxParticipants`: 1-250
- `trackLimitMinutes` is sent only when the selected dropdown value is one of:
  - 5, 10, 15, 20, 25, 30, 60, 90, 120, 180, 240
- Room PATCH/edit limit fields remain out of scope.

## Random Entry

- `GET /api/v1/rooms/random` returns a room-like result with at least `slug`.
- `useRandomEntryRoom` owns the raw mutation.
- `useRandomEntryNavigation` owns the navigation side effect and error message mapping.
- Success routes directly to `/room/{slug}` and does not open the password modal.
- `404` or `room.random-entry-unavailable` is surfaced as "입장 가능한 공개 방이 없어요."

## Badges

- Badge endpoints added:
  - `GET /api/v1/badges`
  - `GET /api/v1/users/me/badges`
  - `GET /api/v1/users/{userSlug}/badges`
  - `PUT /api/v1/users/me/badges/representative`
- Badge query keys:
  - `badgeKeys.catalog()`
  - `badgeKeys.me()`
  - `badgeKeys.publicUser(userSlug)`
- Representative badge mutation invalidates:
  - `badgeKeys.me()`
  - `userKeys.me()`
  - current user's `badgeKeys.publicUser(me.slug)` when `me.slug` is cached.

## User Profiles And Withdraw

- `GET /api/v1/user-profiles/{userSlug}` returns `UserProfile` with optional `representativeBadge`.
- `DELETE /api/v1/user-profiles/me` is exposed through `useWithdrawMe`.
- Withdrawal success sets `userKeys.me()` to `null` and removes badge, follow, public profile, and search caches.

## CSRF Observation

- CSRF bootstrapping calls `GET /api/auth/csrf` once in `Providers`.
- `axiosInstance` then sends the `XSRF-TOKEN` cookie value as `X-XSRF-TOKEN`.
- `axiosInstance` now retries once after forced CSRF refresh when:
  - status is `419`, or
  - status is `400`/`403` and backend code/message mentions `csrf` or `xsrf`.
- Generic auth/permission `401`/`403` responses are not retried.
