# 채팅 관리 메뉴 레이어 수정

## Scope

- 채팅 메시지 관리 드롭다운이 인접 메시지 뒤로 들어가거나 paint containment에 잘리지 않게 한다.
- 닫힌 메시지의 `content-visibility` 최적화와 최대 500개 DOM 상한은 유지한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Acceptance Criteria

- 열린 메시지 행만 높은 stacking 순서와 visible content를 사용한다.
- 다른 메뉴로 전환하거나 닫으면 이전 행의 열린 상태가 제거된다.
- targeted test, lint, full test, build, fresh QA가 통과한다.

## Commit

1. `fix(chat): 관리 드롭다운 레이어 수정`

## Progress

- [x] 원인 확인과 구현
- [x] 검증과 fresh QA (`pass`)
- [x] commit, push, Draft PR #42
