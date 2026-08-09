# 방 floating 모달 위치 초기화

## 상태

- 단계: ready
- 브랜치: `dev`
- 전달 대상: Draft PR #36

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-pr-review-cycle`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `browser:control-in-app-browser`
- `queuing-qa-reviewer`

## 범위

- 참가자 목록의 세로 스크롤 동작은 유지하고 scrollbar UI만 숨긴다.
- 데스크톱 하단 컨트롤 바 오른쪽에 동일 높이의 원형 초기화 버튼을 추가한다.
- 초기화 버튼은 현재 viewport 모드의 프로필·큐·채팅·참가자 패널 drag offset을 기본값으로 되돌린다.
- 열린 패널과 닫힌 패널 상태는 유지하며 현재 viewport 모드의 저장 offset만 제거한다.

## 상태 소유권

- 위치와 저장 offset: `useFloatingWidgetsState`
- 초기화 trigger와 Lucide 아이콘: `RoomControlBar`
- 참가자 scrollbar 표현: `RoomParticipantsPanel.module.css`

## 수용 조건

- 참가자 목록은 휠·트랙패드·키보드 스크롤이 가능하지만 scrollbar track/thumb은 보이지 않는다.
- 초기화 버튼은 기존 바와 같은 높이의 원이고 접근 가능한 이름을 가진다.
- 버튼 클릭 즉시 모든 floating 패널이 현재 화면 크기의 기본 위치로 복귀한다.
- 기존 open 상태와 다른 viewport 모드에 저장된 위치는 유지된다.
- targeted test, 전체 test, lint, build, fresh read-only QA와 원격 CI를 통과한다.

## 커밋 계획

1. `feat(room): floating 모달 위치 초기화 추가`
2. `docs(delivery): floating 위치 초기화 검증 기록`

## 진행

- [x] 참가자 scrollbar와 floating state 소유권 확인
- [x] scrollbar 숨김과 초기화 UI/state 구현
- [x] targeted test, lint, full test, build
- [x] fresh read-only QA
- [x] commit, push, 원격 CI
