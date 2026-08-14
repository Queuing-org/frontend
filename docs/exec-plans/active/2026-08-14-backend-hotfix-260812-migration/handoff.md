# Handoff

- branch: `dev`
- base: `main@275c5aa`
- draft_pr: https://github.com/Queuing-org/frontend/pull/49
- implementation: complete
- automated QA: `npm run lint`, `npm run build`, `npm test -- --run` passed
- fresh QA: passed after sentinel, chat subscription, relationship loading and meta-race fixes
- next: confirm deployed queue cursor contract, run deployment manual QA, then continue PR review cycle

## Blocking Contract Risk

Backend `c91f8a` still validates queue `cursor` and `queueRevision` as a pair. The requested frontend contract removes request `queueRevision`. Confirm the deployed backend differs from this commit before merging; otherwise second-page queue reads fail.
