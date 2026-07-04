# Implementation Notes

## Added Feature Areas

- `src/features/badge`
  - typed badge API clients
  - query keys
  - React Query hooks
  - badge display helpers tolerant of `items` or `badges` list response shapes
- `src/features/user/profile`
  - public user profile fetch hook/API
  - account withdrawal hook/API

## Existing Dirty Worktree

- The worktree already had unrelated dirty room/playlist changes before this task.
- Room participant identity changes were preserved and extended through `getParticipantUserSlug`.
- No unrelated dirty files were reverted.

## Cache Decisions

- Create-room mutation keeps existing `roomKeys.all()` invalidation.
- Random entry is a GET-backed mutation with no cache writes; it navigates on success.
- Badge representative mutation invalidates the current user's badge/profile caches.
- Withdrawal removes user-owned or relationship/search caches after setting `me` to `null`.

## Out Of Scope

- Room edit/PATCH limit fields were not added.
- No browser manual smoke test was run; verification used lint/build.
