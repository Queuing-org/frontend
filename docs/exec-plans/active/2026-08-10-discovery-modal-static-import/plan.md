# 탐색 모달 정적 import 단순화

## Scope

- 홈·검색 화면의 CREATE, FOLLOW, SETTING 모달을 정적 import한다.
- idle/hover/focus/pointer preload와 관련 controller·retry/error 상태를 제거한다.
- 화면별 단일 `activeModal` state로 동시에 하나의 모달만 표시한다.

## Decision

- production bundle 실측에서 세 모달의 unique 지연 청크는 약 31KB gzip이다.
- 기존 구현도 idle 시 세 청크를 모두 받으므로 총 전송량 절감은 없고 초기 critical path만 늦췄다.
- 이 규모에서는 첫 클릭 즉시성, 코드 삭제, 유지보수 단순성이 초기 약 31KB gzip 증가보다 우선이다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Commit Slice

1. `refactor(discovery): 탐색 모달 정적 import로 단순화`
2. `docs(delivery): 탐색 모달 정적 import 검증 기록`

## Acceptance Criteria

- CREATE·FOLLOW·SETTING 클릭 시 별도 chunk 대기나 page-level fallback이 없다.
- 홈과 검색이 각각 단일 modal state를 소유한다.
- preload/idle/intent 전용 소스·props·tests가 남지 않는다.
- 관련 UI 테스트, `npm run lint`, `npm run test`, `npm run build`, fresh read-only QA가 통과한다.

## Progress

- [x] production chunk 크기와 transitive dependency 확인
- [x] 정적 import와 local modal state 적용
- [x] preload 전용 코드·테스트 제거
- [x] 전체 검증과 fresh read-only QA
- [ ] commit, push, Draft PR 및 CI 확인
