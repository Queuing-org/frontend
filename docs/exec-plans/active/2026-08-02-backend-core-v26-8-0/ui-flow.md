# UI Flow

## Queue Pagination

- room entry loads one page per queue tab query.
- explicit load-more interaction appends the next page.
- tab count renders `totalPendingCount`, independent of loaded item count.
- conflict discards stale pages and returns to the first page.

## Personal Reorder

- locked entries remain first in server order and render disabled move affordances.
- reorder payload includes only unlocked own pending entries.
- single move requires both moving and anchor entries to be unlocked.
- backend reorder errors render their server message in the reorder surface.

## Session Replacement

- stop room reconnect for the replaced room.
- clear room/chat subscriptions and transient room state.
- retain the independent app-wide follow presence connection.
- render `현재 방은 다른 창에서 마지막으로 열렸습니다.`
