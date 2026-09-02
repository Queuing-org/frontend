# Participant Identity Contract

- `ROOM_JOINED.data.participant` is the authoritative identity for the current room session.
- Initial join and every reconnect join update the room screen's current participant state.
- Cursor participant pages remain the server-state source for the list. The current joined participant is prepended only when neither its `participantId` nor non-null `userSlug` is present.
- When a fetched page already contains the current user, the fetched participant object wins so refreshed nickname/profile fields are not replaced by stale join data.
- Room access tokens remain excluded from URLs, logs, and query keys; this change adds no endpoint or payload mutation.
