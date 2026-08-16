# Handoff

- Branch: `dev`
- Draft PR: #50
- Implementation, local verification, and final fresh read-only QA (`pass`) are complete.
- The create-room required-field `다음` gating regression is fixed and covered by the room-form tests.
- Shared profile statistics use independent columns, so a two-line favorite song does not shift `칭호`, `큐잉 횟수`, or `음악력`; adjust `--profile-stat-row-gap` for pixel tuning.
- Feature and follow-up commits are pushed to `dev`; Draft PR #50 is updated and the latest follow-up CI is pending.
- Manual pixel QA remains for desktop, compact-height, and 480px layouts.
