# QA Report

## Automated Gates

- `npm run test`: pass, 42 files / 100 tests
- `npm run lint`: pass, warnings 0
- `npm run build`: pass, Next.js production build and 8 routes generated
- `git diff --check`: pass

## Contract Coverage

- queue first/next page request pairing and `totalPendingCount`
- next-page `room.queue-mutation-conflict` reset to a single fresh first page
- infinite-page optimistic reorder/delete cache shape
- owner locked personal-order exclusion and disabled UI
- room list cursor-only request without legacy `lastId`
- strict join event fields and removal of `ROOM_JOIN_FAILED`
- unified `room.access-denied`
- same-room `user.session-replaced` terminal cleanup and different-room ignore
- public participant/requester/chat identity without numeric/nickname fallback
- nullable track thumbnail fallback and required temporary upload metadata

## Manual / Environment-dependent

- Actual same-account multi-window replacement requires a v26.8 backend session and remains manual QA.
- The specific `따뜻한코러스810` room-entry failure reproduced on old and new frontend commits; frontend-regression causality is rejected and the incident record is corrected.

## Fresh Review

- independent read-only QA: pass after fixing one finding
- finding fixed: participant identity helper no longer falls back from `userSlug` to an extra legacy `slug` field
- residual: real backend multi-window event and pointer-level DnD remain manual QA
