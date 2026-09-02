# QA Report

## Result

- classification: pass
- reviewer: fresh read-only agent after two targeted fix rounds
- blocking findings: none

## Findings Resolved

1. 최초 참가자 cursor page에 현재 사용자가 없으면 자기 행이 사라지는 문제
   - `ROOM_JOINED.data.participant`를 화면 state에 보존하고 page 결과에 identity 중복 없이 포함했다.
   - 101명 방에서 현재 참가자가 첫 page 밖인 화면 회귀 테스트를 추가했다.
2. reconnect `ROOM_JOINED`의 최신 참가자 객체를 버리는 문제
   - `useRoomRealtimeEvents`가 최신 participant를 화면 callback으로 전달한다.
   - 변경된 participantId와 nickname을 저장하는 reconnect 회귀 테스트를 추가했다.

## Boundary Review

- 현재 사용자는 첫 행 정렬만 적용하며 sticky row를 만들지 않는다.
- `(나)` DOM 순서와 `#3c3c3c` 색상이 요청과 일치한다.
- self menu는 `Setting`, `Friends`만 제공하고 기존 viewport portal/focus shell을 사용한다.
- 기존 Settings/Friends modal을 draggable transform 밖의 room screen owner가 렌더링한다.
- 다른 참가자 관리 액션과 virtual DOM 24개 상한을 유지한다.

## Verification

- targeted: 6 files, 50 tests passed
- lint: passed
- full test: 153 files, 660 tests passed
- production build: passed
- browser smoke: unavailable because no browser session was connected

## Residual Risk

- 실제 로그인 방과 작은 모바일 실기기의 시각 smoke가 남아 있다.
- modal close 후 참가자 trigger focus 복원은 기존 home modal에도 없는 접근성 부채다.
