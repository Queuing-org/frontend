# Review Findings

## 2026-08-17 Create-room next-button regression

- `actionable`: The create-room wizard currently leaves `다음` enabled when the current step's required input is empty. Restore disabled gating for an empty room title and an empty genre selection, while preserving the validation guards used by non-button step navigation.
- `resolved`: Restored the original `canGoNext` gate for trimmed title, genre selection, thumbnail blocking state, and pending navigation. Added regression coverage for empty/whitespace titles and for selecting then clearing the last genre.
- `resolved`: Draft PR #50 had no failing GitHub Actions checks and no unresolved review threads before the follow-up push.

## 2026-08-17 Profile statistic spacing

- `actionable`: The shared two-column profile grid lets a two-line favorite song increase the first grid row height, which also increases the unrelated `칭호` to `큐잉 횟수` spacing. Split the statistics into independent columns and use the existing `큐잉 횟수` to `음악력` 20px gap for the left-column rhythm.
- `resolved`: Grouped `칭호`, `큐잉 횟수`, and `음악력` in an independent left statistics column, with `최애곡` and `이용 시간` in a separate right column. A two-line favorite song can no longer consume the left-column row track. Exposed the shared gap as `--profile-stat-row-gap` (20px default, 16px compact) for direct pixel tuning.
- `resolved`: Targeted profile coverage passed 3 files/39 tests; full lint, 134 files/515 tests, build, and diff-check passed.
