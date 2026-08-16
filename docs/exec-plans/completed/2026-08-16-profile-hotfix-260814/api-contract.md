# API Contract

Source: backend `main@038f991f` (`hotfix/260814`).

- `UserProfile.online` and follow-list `online`, `room`, `presenceVersion` are permission-dependent optional fields.
- `DELETE /api/v1/user-profiles/me` accepts optional `{ reason }`; omitted/blank means no reason, max 500 after trim.
- `PUT /api/v1/user-profiles/me/blocked-users/{userSlug}` accepts the same optional `{ reason }` and returns 204.
- `GET /api/v1/user-profiles/{userSlug}/music-power` accepts paired `roomSlug` and `entryId`; both omitted produces aggregate score with `myVote: null`.
- `PUT .../music-power` requires `{ roomSlug, entryId, vote }`; one playback entry can be evaluated once and returns `music-power.already-evaluated` on duplicates.
- `room.already-participating` means the requested join did not create the target room session and must not trigger target-room leave.
- `user.session-replaced` may arrive through the user event subscription or the broker STOMP `ERROR` frame and is terminal only for the room socket lifecycle.
