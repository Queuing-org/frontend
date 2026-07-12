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
- Current top-level domains include auth, badge, follow, home, onboarding, playlist, room, settings, and user.
- A feature may import from `src/shared` and from another feature only when the dependency is explicit and does not create a cycle.
- Shared behavior used by multiple domains should move to `src/shared`; domain behavior should not.

### `src/shared`

- Owns cross-feature API infrastructure, generic libraries, styles, and reusable UI primitives.
- Must not import from `src/features` or `src/app`.
- Shared modules should remain domain-neutral unless a deliberate architecture decision documents an exception.

## State Ownership

- TanStack Query owns REST-backed server state.
- STOMP subscriptions deliver real-time events; handlers must reconcile those events with query cache and screen state deliberately.
- Local component state owns transient UI state such as modal visibility, hover state, inputs, and local panel behavior.
- `localStorage` is reserved for persistence that must survive navigation or reload, such as scoped room interaction state.

## High-Risk Boundaries

- API payload -> client -> type -> hook -> consuming UI
- mutation success -> query invalidation or optimistic update
- room password -> REST and WebSocket headers
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
