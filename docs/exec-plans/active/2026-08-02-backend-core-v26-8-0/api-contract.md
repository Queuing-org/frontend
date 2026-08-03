# API Contract

## Queue Pages

- first: `size=100`
- next: previous `nextCursor`, previous `queueRevision`, `size=100`
- response: `items`, `hasNext`, `nextCursor`, `queueRevision`, `totalPendingCount`
- conflict: clear pages and restart from first page

## Public Identity

- participant list key: `participantId`; logged-in identity: `userSlug`
- owner identity: `owner.slug`
- queue requester identity: `addedBy.slug`
- chat identity: `senderSlug`
- no numeric id or nickname fallback

## Join

- event requires `type`, `roomSlug`, `timestamp`, `data`
- accepted types: `ROOM_JOINED`, `ERROR`
- private/not-found failure: `room.access-denied`
- session replacement: `user.session-replaced`

## Thumbnail

- responsive keys: `thumb256`, `thumb384`, `thumb640`, `thumb828`, `thumb1200`
- track thumbnail is nullable
- temporary upload metadata fields are required
