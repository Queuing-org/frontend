# Action Feedback Stack

## Scope

- Add an app-scoped `ActionFeedbackProvider` with stacked, deduplicated, timed notifications.
- Migrate action-result feedback across follow/profile, room management, queue/playback/chat, and settings.
- Keep blocking/read/retry states and confirmation or badge-acquisition modals in their existing owners.
- Add field invalid styling plus global error feedback for explicit validation failures.
- Deliver the work on `dev` and update Draft PR #50.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `frontend-architecture-guardrails`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `queuing-qa-reviewer`

## Ownership Decisions

- App-wide notification lifecycle: `src/shared` provider mounted by the app provider assembly.
- API calls and cache invalidation: existing feature hooks; no notification side effects in API/query hooks.
- Action-specific copy and dedupe keys: consuming feature UI or interaction hook with user/room context.
- Field validation state: owning form hook/component; only presentation and notification delivery are shared.

## Commit Slices

1. `feat(feedback): 공통 액션 알림 스택 추가`
2. `feat(profile): 소셜과 프로필 액션 알림 통합`
3. `feat(room): 방과 큐 액션 알림 통합`
4. `feat(settings): 설정과 입력 오류 알림 통합`
5. `docs(delivery): 액션 알림 통합 검증 기록`

## Acceptance Criteria

- Provider behavior, accessibility roles, timing, dedupe, stack cap, and route-child persistence are tested.
- Every requested action uses the requested copy/tone; success-silent queue actions stay silent.
- Time-based music-power copy and branches are absent.
- Result-only block and owner-transfer modals are removed while confirmation modals remain.
- Explicit validation failures mark fields invalid and issue an error notification.
- `npm run lint`, `npm run test`, `npm run build`, and `git diff --check` pass.
- Fresh read-only QA result is `pass` before publication.

## Progress

- [x] Request and skill routing recorded.
- [x] Existing feedback surfaces inventoried.
- [x] Common provider implemented and tested.
- [x] Feature integrations completed and tested.
- [x] Full verification completed.
- [x] Fresh QA completed.
- [x] Commits pushed and Draft PR #50 updated.

## Residual Risk

- Manual pixel QA at desktop, compact, and 480px remains a human verification step.
- Live backend/STOMP integration remains outside the automated local test boundary.
