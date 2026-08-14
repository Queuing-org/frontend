# Room thumbnail realtime resync

## Problem

`ROOM_INFO_UPDATED` did not contain a thumbnail URL, so an optimistic metadata merge could leave room and discovery thumbnails stale.

## Previous Behavior

The handler merged event fields and scheduled a generic metadata invalidation. Thumbnail freshness depended on delayed cache behavior.

## Previous Code

```ts
setQueryData(roomMetaKey, current => applyRoomInfoUpdate(current, event.data));
scheduleRoomInvalidation(slug, ["meta"]);
```

## Updated Code

```ts
setQueryData(roomMetaKey, current => applyRoomInfoUpdate(current, event.data));
void fetchRoomMeta(slug).then(meta => setQueryData(roomMetaKey, meta));
invalidateQueries({ queryKey: roomKeys.all() });
```

## Problem in the Previous Code

The event is intentionally incomplete. Treating it as authoritative cannot update omitted thumbnail data and coalescing may delay the only authoritative read.

## Evidence

- Backend `c91f8a7` event payload was inspected and contains no thumbnail field.
- Frontend event validation and authoritative fetch are covered by automated tests/build.
- Deployed two-browser reproduction was unavailable.

## Cause or Remaining Hypotheses

Confirmed contract gap: thumbnail belongs to REST room metadata, not the websocket event.

## Solution Options

- Add thumbnail to the event contract.
- Invalidate and wait for active query refetch.
- Fetch room metadata for every valid update event and write the result.

## Chosen Solution and Rationale

Fetch metadata per event. It is deterministic and keeps the event useful for immediate text/tag updates while REST owns the complete snapshot.

## Result

Room detail receives the authoritative thumbnail and room discovery lists are invalidated after each valid room-info event.

## Reusable Rule

When a websocket update omits a displayed server field, use it for immediate partial state only and reconcile with an authoritative REST read.

## Skill or Team Spec Updates

- skill updated: `queuing-api-boundary` hotfix cursor/update rules
- team spec updated: no

## Verification

`npm run lint`, `npm test -- --run`, and `npm run build` passed. Deployed two-browser verification remains pending.
