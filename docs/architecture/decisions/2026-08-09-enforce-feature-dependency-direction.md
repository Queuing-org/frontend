# Enforce Feature Dependency Direction

- Status: accepted
- Date: 2026-08-09

## Context

The runtime audit found domain-aware hooks in `src/shared` and room search code importing home-only UI. Those imports inverted the documented dependency direction and made the room and home features vulnerable to cycles.

## Decision

- Move authenticated-action behavior to `src/features/auth/hooks`.
- Move room navigation and pagination behavior to `src/features/room/hooks`.
- Let `src/features/room/discovery` own controls shared by the home and search room-discovery screens.
- Keep the brand-only main logo in `src/shared/ui`.
- Enforce both `shared -> feature/app` and `room -> home` prohibitions with ESLint.

## Consequences

Home may assemble room-discovery components, but room code cannot depend on home. Generic shared code remains domain-neutral. New cross-feature dependencies must follow the same one-way direction or be recorded as a separate architecture decision.

## Verification

- `npm run lint`
- `npm run build`
- Static searches for imports from `src/shared` into feature/app code and from room into home code
