# Handoff

- Branch: `dev`
- Draft PR: #50
- Implementation, local verification, and final fresh read-only QA (`pass`) are complete.
- The create-room required-field `다음` gating regression is fixed and covered by the room-form tests.
- Shared profile statistics use independent columns, so a two-line favorite song does not shift `칭호`, `큐잉 횟수`, or `음악력`; adjust `--profile-stat-row-gap` for pixel tuning without changing the favorite-song footprint.
- Edit-room track-limit and participant-limit fields share one equal-width row, participation uses the create-room dropdown behavior, and delete/submit actions split one footer row equally.
- Feature and follow-up commits are pushed to `dev`; Draft PR #50 is updated and the edit-room implementation CI passed.
- Manual pixel QA remains for desktop, compact-height, and 480px layouts.
