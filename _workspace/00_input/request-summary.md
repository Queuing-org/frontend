# Request Summary

Date: 2026-06-17 19:51 KST

User asked to implement the previous agent's responsibility-separation refactor plan in a fresh context.

Primary intent:

- Move feature-owned API/query/type/UI out of `src/entities` and composed surfaces out of `src/widgets`.
- Keep `src/app/*/page.tsx` thin and route-owned.
- Stabilize API contract helpers first: query keys, password headers, API response unwrap/assert helpers.
- Introduce shared CSS design tokens through `src/shared/styles/tokens.css`.
- Split high-risk room, queue, chat, add-track, create/update/join, search/home/follow/settings components by responsibility while preserving existing behavior.
- Verify with `npm run lint` and `npm run build`.

Relevant local rules:

- React Query owns server state and mutations must invalidate affected query keys.
- Protected room REST requests include `X-Room-Password` only when a truthy password exists.
- STOMP room join flow keeps `/user/playlist/events` subscription before `/app/room/{slug}/join` publish.
- Publish calls should not add room password headers unless a specific backend contract requires it.
- Final source should not import from `src/entities` or `src/widgets`.
