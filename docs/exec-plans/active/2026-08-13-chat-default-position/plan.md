# 채팅 플로팅 패널 기본 위치 조정

## 상태

- 단계: ci-pending
- 브랜치: `dev`
- 전달 대상: 기존 Draft PR #48

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 범위

- 저장 위치가 없는 데스크톱 채팅 패널을 참가자 패널과 우측 정렬한다.
- 채팅 패널의 상단은 신청곡 패널 높이의 중앙을 기준으로 둔다.
- 화면 높이가 짧을 때는 참가자 패널 아래에 밀도별 24px/19.2px 간격을 보장한다.
- 기존에 저장된 사용자의 드래그 위치는 유지한다.
- 위치 초기화와 저장값이 손상된 경우에는 새 기본 위치를 사용한다.

## 상태 소유권

- 기본 좌표·viewport 밀도·저장 offset: `useFloatingWidgetsState`
- 패널 DOM과 드래그 동작: 변경 없음
- API·React Query·공용 payload: 변경 없음

## 수용 조건

- normal, compact, wide-short compact에서 채팅 기본 위치가 참가자 아래쪽에 있다.
- 채팅은 참가자 패널과 우측 기준선이 같고 신청곡 패널 중앙 높이 부근에서 시작한다.
- 짧은 화면에서도 참가자 패널과 겹치거나 바로 붙지 않는다.
- 저장된 위치가 있으면 새 기본값보다 우선한다.
- 동일 density resize와 위치 초기화가 새 기본 배치를 유지한다.
- targeted test, 전체 test, lint, build, fresh read-only QA를 통과한다.

## 커밋 계획

1. `fix(room): 채팅 패널 기본 위치 조정`
2. `docs(delivery): 채팅 기본 위치 검증 기록`

## 진행

- [x] 플로팅 패널 좌표·저장 상태 소유권 확인
- [x] 새 기본 좌표와 저장값 우선 처리 구현
- [x] targeted test, lint, full test, build
- [x] fresh read-only QA
- [x] commit, push, Draft PR #48 갱신

## 후속 수정

- 사용자 DevTools 확인으로 최초 구현이 중앙 하단 DOM anchor를 유지하고 큰 drag transform으로 새 위치를 표현한 것을 확인했다.
- 채팅 DOM base placement를 직접 `right`/`top` 새 위치로 옮기고 기본 drag offset을 `{ x: 0, y: 0 }`으로 정리했다.
- 기존 `chatWidgetOffset` 저장값은 `chatWidgetOffset:v2`로 한 번 변환해 화면상 위치를 유지한다.
- 후속 targeted test, full test, lint, build와 fresh read-only QA를 다시 수행한다.
