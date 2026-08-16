# QA Report

## Automated

- `npm run lint`: passed
- `npm test -- --run`: passed, 120 files / 426 tests
- `npm run build`: passed, onboarding route absent from route manifest
- targeted API/error/auth tests: passed

## Manual

- Two-browser deployed-environment validation was not run because no hotfix deployment URL/authenticated sessions were provided.
- Mobile/desktop visual scrolling remains a deployed-environment manual check.

## Merge Blocker

Queue cursor-only requests conflict with the inspected backend `c91f8a7` source, which requires `queueRevision` alongside cursor. Confirm deployed behavior before merge.
