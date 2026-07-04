# QA Report

Result: pass with residual API-shape risk.

## Automated Verification

- `git diff --check`: pass.
- `npm run lint`: pass.
- `npm run build`: pass.

## Boundary Checks

- Create-room max participants is digit-filtered, capped by validation at 250, and omitted when empty.
- Create-room track limit is selected from fixed dropdown values and omitted when "제한 없음".
- Random entry routes directly to `/room/{slug}` and never calls protected room entry/password modal flow.
- Shared desktop control behavior is wired in both home and search because both use `HomeSearchControlDock`.
- Badge representative mutation invalidates `badgeKeys.me()`, `userKeys.me()`, and the current user's public badge query.
- Participant badge display uses list-level `useQueries` with deduped user slugs; cards do not fetch.
- Settings badge UI uses the existing profile "칭호" row instead of an added card section.
- Withdrawal success clears `me` and removes badge/follow/profile/search caches.

## Residual Risk

- Badge response shapes were inferred from the plan, not confirmed against live API docs. Helpers tolerate common `items`/`badges` list variants, but field-name drift is still possible.
- Native `<option>` font styling can vary by browser; unacquired options are still disabled and sorted below acquired options.
- CSRF refresh retry is conservative: `419` always retries once; `400`/`403` retry only when code/message contains `csrf` or `xsrf`.
- Manual browser/API checks were not run against a live backend in this turn.
