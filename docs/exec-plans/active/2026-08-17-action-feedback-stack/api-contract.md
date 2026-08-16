# API Contract

- No backend endpoint, payload, response, or WebSocket contract changes.
- Existing API clients and mutations remain responsible for transport and cache reconciliation only.
- UI owners translate `ApiError` server messages and action context into notification copy.
- Music-power duplicate copy is emitted only for `music-power.already-evaluated`; all other failures prefer the server message and fall back to the generic failure copy.
- Queue success flows remain notification-silent; mutation and WebSocket failures notify without changing existing cache recovery behavior.
