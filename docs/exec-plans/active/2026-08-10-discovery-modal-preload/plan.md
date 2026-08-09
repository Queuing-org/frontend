# 탐색 메뉴 모달 선로딩

## Scope

- 홈과 검색 화면의 `CREATE`, `FOLLOW`, `SETTING` 모달은 dynamic chunk 분리를 유지한다.
- 화면 안정화 뒤 idle 시점과 메뉴 항목 hover·focus·pointer intent에서 chunk를 미리 받는다.
- 클릭 시 해당 chunk가 준비된 뒤 모달 open state를 변경해 전체 화면 loading fallback이 노출되지 않게 한다.
- 비밀번호 방 입장 모달은 이번 요청 범위에서 제외한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Commit Slice

1. `fix(discovery): 지연 모달 클릭 전 선로딩`
2. `docs(delivery): 모달 선로딩 검증 기록`

## Acceptance Criteria

- CREATE·FOLLOW·SETTING은 최초 클릭에서도 full-screen loading spinner를 렌더하지 않는다.
- 세 모달은 홈 초기 JavaScript에 정적 import되지 않는다.
- idle preload는 지원 브라우저와 fallback timer 양쪽에서 동작하고 unmount 시 예약 작업을 정리한다.
- 데스크톱 메뉴와 모바일 빠른 메뉴의 hover·focus·pointer intent가 해당 모달만 선로딩한다.
- preload 실패는 다음 intent/click에서 재시도 가능하다.
- preload 중에는 다른 discovery 모달 요청을 무시해 둘 이상의 모달이 동시에 열리지 않는다.
- targeted test, `npm run lint`, `npm run test`, `npm run build`, fresh read-only QA가 통과한다.

## Progress

- [x] 현재 dynamic import와 fallback 원인 확인
- [x] preload resource·idle scheduler 구현
- [x] 홈·검색·모바일 intent 연결
- [x] 회귀 테스트와 전체 검증
- [x] 기능·테스트 commit
- [x] dev push, Draft PR #39 생성 및 CI 확인
