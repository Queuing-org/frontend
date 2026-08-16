# Review Findings

## 2026-08-17 Create-room next-button regression

- `actionable`: The create-room wizard currently leaves `다음` enabled when the current step's required input is empty. Restore disabled gating for an empty room title and an empty genre selection, while preserving the validation guards used by non-button step navigation.
- `resolved`: Restored the original `canGoNext` gate for trimmed title, genre selection, thumbnail blocking state, and pending navigation. Added regression coverage for empty/whitespace titles and for selecting then clearing the last genre.
- `resolved`: Draft PR #50 had no failing GitHub Actions checks and no unresolved review threads before the follow-up push.
