# UI Flow

## Ownership

- TanStack Query: history/queue pages, directional loading/error state, 5-page history window.
- `useRoomQueuePanel`: tab state, query composition, mutation busy state, latest-history reset action.
- `RoomQueuePanelView`: scroll container, top/bottom threshold coordination, current-track anchor, prepend/eviction scroll preservation.
- list components: history/current static rows and pending-only sortable rows; transient drag state remains local to DnD.

## All tab

- visual order is oldest retained history → newest history → current track → pending queue.
- on entry and current entry ID change, align current row to container top without smooth scrolling; if absent, use the history/queue boundary.
- within 96px of top, fetch one older history page unless loading, refetching, dragging, or mutating.
- preserve the viewed row by history ID and geometry across prepend and 5-page newest-side eviction.
- synchronize virtual spacer geometry in the item-count change commit so current alignment and prepend correction never measure the previous window.
- keep a separate content-end marker and dynamic tail spacer so a short queue can place current at the real viewport top without delaying bottom pagination; restore current alignment after browser scroll clamping caused by content shrink.
- when the newest history page was evicted, render a discontinuity boundary and a `현재 곡으로 돌아가기` reset action rather than implying continuity.
- within 96px of bottom, fetch one queue page under the same busy guards.

## Mine tab

- no history/current rows.
- current track changes do not switch tabs or scroll.
- within 96px of bottom, fetch one personal queue page unless loading, refetching, dragging, or mutating.

## Failure and accessibility

- existing rows stay mounted after incremental failures.
- top and bottom errors each expose an in-direction retry button.
- scroll region remains keyboard focusable and controls use buttons/ARIA live status.
