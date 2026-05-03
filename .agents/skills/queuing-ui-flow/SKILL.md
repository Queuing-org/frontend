---
name: queuing-ui-flow
description: Implement queuing-org room, home, search, modal, and queue interactions while preserving state ownership and CSS module boundaries.
---

# Queuing UI Flow

## When to Use

Use this skill for:

- home/search control panels, menu chips, filters, and room cards
- room interior widgets, floating panels, profile, chat, queue, and playback controls
- create/edit room modal behavior
- playlist add-track modal and queue card interactions
- drag-and-drop, hover, active, disabled, loading, and error states

Do not use it for API-only changes unless the UI behavior also changes.

## Required Inputs

- target screen or component path
- desired interaction states and screenshots when available
- current state owner and whether state must affect API calls or sorting
- visual constraints: fixed dimensions, responsive behavior, assets, hover/focus states

## Workflow

1. Locate the route and composed widget first, then follow into feature/entity components.
2. Identify state ownership:
   - screen-level state when filters, room list order, or selected controls affect multiple children
   - component-local state for transient modal, hover, text input, or dropdown UI
   - React Query mutation state for API-backed pending/error behavior
3. Preserve existing CSS Modules and component boundaries. Avoid moving unrelated layout code.
4. Use existing public assets before adding new icons or images.
5. Make hover/focus/disabled states explicit and prevent layout jumps where the UI is fixed-format.
6. For drag interactions, prevent unintended text/image selection and keep buttons from starting drag gestures.
7. Write `_workspace/02_ui_flow.md` for large or interaction-heavy changes.

## Project-Specific Rules

- Room floating widgets use `FloatingRoomPanelShell`; visual panel-wide changes should start there before touching each child.
- Home and search controls share `HomeControlPanelShell`; behavior should stay consistent across both surfaces.
- Queue reordering is only for the current user's pending entries unless product requirements change.
- CSS chip and modal sizing should be controlled in the relevant module, not by inline patching across call sites.
- Do not introduce marketing-style landing sections for app surfaces; build the usable workflow.

## Outputs

- updated React components and CSS modules
- state ownership notes for future sorting/filter/API work
- `_workspace/02_ui_flow.md` for complex interaction changes

## Validation

- UI state has one clear owner.
- Keyboard/focus behavior is not broken by hover-only controls.
- Fixed-size UI does not jump unexpectedly except where the requested interaction explicitly opens space.
- Shared surfaces still share logic after the change.
- `npm run lint` and `npm run build` pass for code changes unless skipped by the user.
