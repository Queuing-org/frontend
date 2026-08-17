# Queuing Architecture

This file is the canonical high-level map of the current codebase. Update it in the same change when a structural boundary changes.

## System Map

```text
Next.js routes (`src/app`)
  -> feature APIs, models, hooks, and UI (`src/features`)
    -> shared API, libraries, styles, and UI (`src/shared`)
      -> REST API and STOMP WebSocket backend
```

## Layers

### `src/app`

- Owns App Router routes, layouts, providers, templates, and page assembly.
- Keeps domain behavior out of route files when it can live in a feature.
- May import from `src/features` and `src/shared`.

### `src/features`

- Owns domain-specific API clients, query hooks, models, interaction state, and UI.
- Current top-level domains include auth, badge, follow, home, playlist, room, settings, and user.
- A feature may import from `src/shared` and from another feature only when the dependency is explicit and does not create a cycle.
- Shared behavior used by multiple domains should move to `src/shared`; domain behavior should not.
- Room discovery owns room-list navigation, pagination triggers, and the shared home/search control dock under `src/features/room/discovery`. The home screen assembles those room-domain capabilities but the room domain must not depend back on `src/features/home`.
- Public user-profile presentation is owned by `src/features/user/profile/ui/UserProfileContent`. Room and follow surfaces compose their own actions around that body instead of importing each other's profile panels.

### `src/shared`

- Owns cross-feature API infrastructure, generic libraries, styles, and reusable UI primitives.
- Must not import from `src/features` or `src/app`.
- Shared modules should remain domain-neutral unless a deliberate architecture decision documents an exception.
- Brand-only presentation such as the main logo may live in `src/shared/ui`; authenticated actions and room navigation remain in their owning auth and room features.
- Domain-neutral management-menu focus, outside-click, Escape, placement, visual shell behavior, and opt-in viewport portal positioning live in `src/shared/ui/management-menu`; room and follow features provide only their allowed actions.
- Room thumbnail file validation, temporary upload selection, and the shared temporary-upload mutation live in `src/features/room/hooks`; create and update flows own only their submit orchestration.
- Domain-neutral floating-panel chrome and drag handles live in `src/shared/ui/floating-panel`; room and follow features own placement state and panel-specific content.
- ESLint rejects imports from `src/shared` into `src/features` or `src/app`, and rejects imports from the room feature back into the home feature.

## State Ownership

- TanStack Query owns REST-backed server state.
- STOMP subscriptions deliver real-time events; handlers must reconcile those events with query cache and screen state deliberately.
- App-wide follow presence and room membership use separate STOMP clients because their authentication, ownership, and reconnect lifecycles are independent. A terminal room event such as `user.session-replaced` must not stop the follow presence transport.
- Room membership owns `roomAccessToken` in memory plus room-scoped `sessionStorage`. The token is issued by `ROOM_JOINED`, authenticates room topic subscriptions and room-internal REST requests, survives transport reconnects, and is never part of a URL, log, or TanStack Query key.
- Local component state owns transient UI state such as modal visibility, hover state, inputs, and local panel behavior.
- `FollowModal` owns the selected follow user and originating card trigger while its nested profile dialog is open, so close and block flows can restore focus without list-owned expansion state.
- `localStorage` is reserved for persistence that must survive navigation or reload, such as scoped room interaction state.
- App-scoped action feedback survives route-child replacement, so terminal room cleanup can notify before navigating home without a `sessionStorage` handoff.
- Public `UserProfile.relationship` is the authoritative follow-button state. Follow/search lists use cursor-based infinite queries and keep transient paging state inside TanStack Query.

## High-Risk Boundaries

- API payload -> client -> type -> hook -> consuming UI
- mutation success -> query invalidation or optimistic update
- first-join password / reconnect access token -> join payload, authenticated room subscriptions, REST headers, and terminal cleanup
- STOMP event -> query cache or local state
- modal/floating widget state -> route and component ownership
- Enter submission -> Korean IME composition handling

Use the API, UI, QA, and incident skills under `.agents/skills/` when a change crosses these boundaries.

## Current Non-Layers

`src/entities` and `src/widgets` are not current directories. Do not create them because an older document mentions them. Introducing either layer requires an explicit architecture decision and a migration plan.

## Structural Change Rule

When adding a new top-level source layer or changing dependency direction:

1. Record the rationale under `docs/architecture/decisions/`.
2. Update this file and affected agent guidance.
3. Add or update mechanical checks when the boundary can be enforced.
4. Run the repository verification commands.
