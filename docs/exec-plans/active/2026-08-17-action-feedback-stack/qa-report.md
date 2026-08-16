# QA Report

## Automated Verification

- `npm run lint`: passed
- `npm run test`: passed — 134 files, 516 tests
- `npm run build`: passed
- `git diff --check`: passed
- Draft PR #50 checks for `830bb2b`: GitHub Actions lint/test/build, Vercel, CodeRabbit passed
- Draft PR #50 checks for edit-room implementation head `8786ba5`: GitHub Actions lint/test/build, Vercel, CodeRabbit passed

## Focused Coverage

- Provider roles, 1.5 second expiry, fixed 160ms exit, key refresh/debounce, five-item cap, route-child persistence, and delete-path dedupe.
- Follow copy and stale 409 normalization; block confirmation closure; profile and badge field errors.
- Music-power success, duplicate/login/error copy, absence of time-limit copy, and synchronous rapid-click suppression.
- Initial-owner silence, real ownership transfer including delayed current-user lookup, leave publish failure/success, direct/realtime deletion keys, and room-member entry-point consistency.
- Create/edit/join field invalid state, screen-reader descriptions, field-specific correction, thumbnail failures, and password server failures.
- Add/delete/move/SKIP success silence plus publish, timeout, conflict, locked-order, URL, story, duration, and network failures.
- Chat send action failure notification while history and paging errors remain in their retry owners.

## Review Cycles

- First read-only review: `fix`; provider timer, leave flow, edit validation, profile native validation, accessibility, stale follow conflict, and missing integration coverage were corrected.
- Second read-only review: `fix`; room password correction, add-track field ownership, create/edit field-specific clearing, delayed owner lookup, and additional UI integration tests were corrected.
- Final publication review: `pass`; no blocking findings.
- User regression follow-up: `pass`; restored disabled gating for the create-room `다음` button when the trimmed title or genre selection is empty, and retained blocking for thumbnail upload/error states. The focused room-form suite passed 19 tests before the full suite.
- Profile spacing follow-up: `pass`; the left `칭호 → 큐잉 횟수 → 음악력` column is independent from the two-line favorite-song column, the favorite-song value keeps a one-line layout slot even when its text wraps, and one CSS custom property owns the left-column row gap. Shared profile coverage passed 3 files/39 tests before the full suite.
- Edit-room layout follow-up: `pass`; track-limit and participant-limit controls are equal-width peers on one row, participation spans the row and follows the create-room click/outside-click/Escape behavior, all three chevrons share the same shape, and delete/submit actions split one footer row equally. Focused edit-room/profile coverage passed 5 files/62 tests before the full suite.

## Residual Risk

- Desktop, compact-height, and 480px pixel QA remains a manual user step by request.
- Live backend/STOMP integration remains outside the automated local test boundary.
