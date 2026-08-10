# QA Report

## Result

- classification: pass
- reviewer: fresh read-only QA agent
- blocking issues: none

## Automated Verification

- `npm run lint`: pass
- `npm run test`: pass, 108 files / 330 tests
- `npm run build`: pass
- failed-test isolation: pass, 4 files / 33 tests with `--maxWorkers=1`
- `git diff --check`: pass

The first full test attempt hit five 5-second timeouts while the machine was under parallel load. Every affected file passed in isolation, and the unchanged full command then passed all tests. This was treated as execution-environment evidence, not hidden as a successful first run.

## Review Coverage

- scrollbar hiding is applied to the actual chat, participant, and queue overflow containers while focusability and virtualization remain intact
- chat order, short-list bottom alignment, prepend/auto-scroll logic, fade, hover, and menu layering
- shared management-menu alignment, shadow, focus, outside click, and Escape behavior
- FOLLOW nested profile ownership, public-profile composition, actions, cache invalidation, close paths, and trigger focus restoration
- discovery dock locking and layer behavior, stable top-bar rows, and unchanged mobile quick-menu path
- room-form furthest-step navigation and field preservation
- removal of user-visible HTTP status suffixes while retaining internal `ApiError` branching
- architecture dependency direction and documentation consistency

## Residual Manual QA

No browser instance was available to the session. Desktop, compact, and mobile visual inspection remains required for exact fade/layer appearance, hidden-scrollbar input behavior, and real-browser focus restoration when a list refetch removes the originating card.
