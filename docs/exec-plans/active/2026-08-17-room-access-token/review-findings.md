# PR #52 Codex Review Findings

Reviewed source: Codex review on commit `f22d11d`, inspected against current `dev` head.

## Findings

1. `useRoomRealtimeEvents.ts` — explicit leave clears the parent token before the delayed home navigation finishes.
   - classification: actionable
   - evidence: clearing parent state unmounts `RoomLeaveConfirmDialog`, whose cleanup cancels the 500ms navigation timer.
   - fix: clear persisted credentials and subscriptions immediately, but keep the mounted screen token state until route replacement unmounts the screen.
2. `UpdateRoomButton.tsx` — current-track `RoomMeta.thumbnailUrl(s)` may be mistaken for an editable custom room thumbnail.
   - classification: conflict / backend-contract blocker
   - evidence: backend `RoomMetaResponse` returns a custom room thumbnail when present and otherwise falls back to the current-track thumbnail through the same fields. It exposes no source or custom-thumbnail-presence signal.
   - decision: do not add a CDN URL heuristic or remove the user-requested delete capability. A backend `hasCustomThumbnail` or dedicated custom-thumbnail field is required for a trustworthy frontend fix.
3. `RoomFormModal.tsx` — a successful room POST followed by a failed join retries the POST instead of the join.
   - classification: actionable
   - evidence: the created slug and password target were scoped to one submit call and discarded after the join catch.
   - fix: retain the created join target, lock already-persisted form fields, and make subsequent completion attempts retry only the same join.

## GitHub write boundary

- Code commits and push are authorized by the user.
- Do not reply, resolve threads, submit a review, change PR readiness, or merge.

## Verification

- focused: 3 files / 38 tests passed
- full: 145 files / 562 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed
- QA classification: `fix` — findings 1 and 3 pass; finding 2 remains blocked on the response contract
