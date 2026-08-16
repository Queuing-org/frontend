# API Contract

- Errors: only nested `error.statusCode/code/message/fieldErrors` are backend errors. Empty bodies fall back to HTTP status and Axios message. GET 429 uses `Retry-After` retry policy and code `too-many-requests`.
- Removed: onboarding route/feature/payload/mutation and callback 403/404 onboarding fallbacks.
- Room: `music-tags`, `random-selection`, `chat-messages`, `queue-entries`; queue delete/move use DELETE/PATCH 204 without unwrap.
- Cursor: room and queue requests send one opaque `cursor`; response queue revision/count remain available.
- Profile: follow/block/badge/music-power live under `user-profiles`; relationship mutations invalidate target profile, search, follower, following and blocked roots.
- Optional updates: room title and profile nickname are omitted unless changed.

## Confirmed Mismatch

The inspected backend commit `c91f8a7` still rejects a queue cursor without `queueRevision`. This implementation follows the explicit migration request and contract tests assert cursor-only. Deployment compatibility must be confirmed before merge.
