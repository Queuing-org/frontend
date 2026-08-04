# UI Flow

## Music Power

- no vote + UP/DOWN click -> PUT selected vote
- same selected direction click -> DELETE
- opposite direction click -> PUT replacement
- `aria-pressed` reflects selection
- disabled for self, guest target, or pending mutation

## Badge Award

- one authenticated app-scoped EventSource
- only `badge-awarded`
- dedupe by event id + badgeCode
- enqueue every badge and show one accessible modal at a time
- confirm, Escape, backdrop close current and advance

## Profile And Presence

- status message is single line, max 255 chars
- omitted/null does not update; empty string deletes
- show below current requester nickname
- follower/following cards show online state and linked public room
- only presence events newer than cached `presenceVersion` update both lists

## Queue Panel

- current queue and my queue preserve existing sort/delete behavior over fully aggregated pages
- `지난 곡` tab shows track, thumbnail, requester, played/skipped state, duration/end time
- explicit `더 보기` loads the next history page
