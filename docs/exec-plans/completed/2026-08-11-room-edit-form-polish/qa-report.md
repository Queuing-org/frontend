# QA Report

## Result

- classification: pass after targeted fixes
- independent QA initially found two FREE presentation gaps:
  - mobile home still rendered `태그없음`
  - no selected room incorrectly rendered `FREE`
- both findings were fixed and covered by regression tests.

## API and State Boundaries

- temporary upload: `POST /api/v2/rooms/thumbnail`, multipart `file`
- thumbnail replacement: `PUT /api/v2/rooms/{encodedSlug}/thumbnail`
- replacement body contains only `{ thumbnailUploadToken }`
- empty token and `result: false` are rejected.
- successful replacement invalidates `roomKeys.all()` and normalized `roomKeys.meta(slug)`.
- edit submission orders general PATCH before thumbnail PUT.
- if PATCH succeeds and PUT fails, the modal remains open and retry sends only PUT.

## UI Boundaries

- create genre `다음` is disabled with zero selected tags.
- real rooms with an empty tag array display `FREE`; the no-room placeholder preserves `태그없음`.
- edit thumbnail reuses the shared file validation/preview field and create upload contract.
- edit maximum participants uses create options while preserving legacy/null current values.
- participant management menu opts into a body portal and follows small list scrolls; leaving the virtual window closes it.
- follow-room visual is 16×16 while the interactive hit target remains accessible.
- chat top blur is isolated to the local non-interactive pseudo-layer, not the YouTube/container composition boundary.

## Verification

- `npm run lint`: pass
- `npm run build`: pass
- targeted changed-flow suites: pass
- `npm test -- --testTimeout=15000`: 114 files, 389 tests pass
- the default 5s test timeout produced nondeterministic timeouts under full-suite load; every timed-out suite passed in targeted reruns, and the complete suite passed with a 15s timeout.
- `git diff --check`: pass

## Residual Risk

- browser control was unavailable in this environment. The `backdrop-filter`/mask rendering and Chromium scroll-composition flicker still need a signed-in manual browser smoke test.
