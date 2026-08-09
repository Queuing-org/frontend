# 프론트 런타임·미사용 코드 전수 감사

## Scope

- 확인된 `FollowModal` 미사용 검색/친구추가 CSS를 제거한다.
- 방·재생목록 런타임, 소셜/사용자 UI, 공유 계층·App Router·빌드 설정을 병렬로 감사한다.
- 실제 호출 경로가 확인되는 네트워크 과다 요청, 렌더 폭증, 중복 구독, listener/timer 누수, 비정상적으로 커지는 상태와 미사용 코드를 찾는다.
- 최초 감사와 다른 에이전트의 교차 검토를 거쳐 추측성 최적화와 오탐을 제외한다.
- 이번 변경에서는 확인된 미사용 CSS만 삭제하고, 그 밖의 구조 변경은 위험도와 수정안을 보고서로 남긴다.

## Selected Skills

- `queuing-orchestrator`
- `queuing-feature-delivery`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `queuing-qa-reviewer`
- `queuing-incident-curator`
- `frontend-architecture-guardrails`

## Audit Lanes

1. room runtime: room/playlist/WebSocket/chat/queue/playback/floating UI
2. social UI: follow/user/settings/badge/home/search/auth/onboarding
3. shared/build: shared/app/providers/config/dependencies/public assets

## Severity

- P0: 서비스 사용 불가·데이터 손실·지속적인 자원 폭주
- P1: 일반 사용 흐름에서 뚜렷한 렉·요청 폭증·메모리 누수
- P2: 특정 규모나 상호작용에서 체감 성능/유지보수 비용 악화
- P3: 미사용 코드·중복·낮은 위험의 정리 대상

## Acceptance Criteria

- 모든 finding은 파일/라인, 실제 실행 조건, 영향, confidence, 권장 수정과 검증 방법을 가진다.
- 교차 검토에서 기각된 finding과 기각 이유를 기록한다.
- 미사용 FollowModal CSS selector가 제거되고 실제 친구 추가 입력 UI는 영향받지 않는다.
- `npm run lint`, `npm run test`, `npm run build`, `git diff --check`, fresh QA가 통과한다.
- `dev`에 explicit staging/commit/push하고 Draft PR #37과 CI 상태를 갱신한다.

## Progress

- [x] 감사 범위와 3개 lane 확정
- [x] 미사용 FollowModal CSS 사용처 확인
- [x] 미사용 FollowModal CSS 제거
- [x] 병렬 1차 감사
- [x] 에이전트 상호 교차 검토
- [x] 통합 보고서와 우선순위 확정
- [x] 전체 검증과 fresh QA
- [x] commit, push, Draft PR #37 갱신 및 CI 확인
