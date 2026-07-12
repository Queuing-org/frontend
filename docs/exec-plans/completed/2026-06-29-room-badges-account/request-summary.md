# Request Summary

Date: 2026-06-29 KST

User asked to implement the previous agent's plan in a fresh context.

Primary intent:

- Add create-room limit fields for `maxParticipants` and `trackLimitMinutes`.
- Add random room entry through `GET /api/v1/rooms/random`, wired to desktop `RANDOM` and mobile quick action, routing directly to `/room/{slug}` on success.
- Add badge API/types/query hooks, settings catalog selection UI, room profile representative badge display, and participant representative badge display.
- Add public user profile fetch for `GET /api/v1/user-profiles/{userSlug}` with `representativeBadge`.
- Add account withdrawal through `DELETE /api/v1/user-profiles/me` with confirmation and cache cleanup.
- Verify with `npm run lint` and `npm run build`.

Important constraints:

- Current worktree already has unrelated dirty room/playlist changes. Do not revert them.
- PATCH room edit limit fields are out of scope because the plan only covers `POST /api/v1/rooms`.
- Server state stays in TanStack Query; mutation success paths must deliberately update or invalidate affected query keys.
