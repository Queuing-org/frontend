# QA Report

## 판정

- `pass`
- 차단 및 비차단 이슈 없음

## 경계 검토

- 참가자 목록은 `overflow-y: auto`를 유지하고 브라우저별 scrollbar 표현만 숨긴다.
- 초기화 trigger는 `RoomControlBar`, 위치·storage 상태는 기존 소유자인 `useFloatingWidgetsState`가 담당한다.
- 현재 viewport 모드의 네 offset만 기본값으로 복구하고 다른 모드와 open 상태는 유지한다.
- `layoutKey` reset version을 올려 이미 열린 uncontrolled `Draggable`도 즉시 재마운트한다.
- 일반 화면은 바와 버튼 모두 76px, compact 화면은 모두 60.8px이며 버튼은 원형과 focus-visible 상태를 가진다.

## 검증

- focused: 3 files, 12 tests passed
- full: 82 files, 249 tests passed
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- fresh read-only QA: pass

병렬 `npm run test`와 `npm run build` 실행 중 기존 `ChatArea` 테스트가 한 차례 5초 timeout 됐다. 동일 테스트 단독 7개와 전체 테스트 단독 249개가 통과해 이번 diff의 재현 가능한 회귀로 분류하지 않았다.

## 수동 QA 제한

- 로컬 앱 응답은 확인했으나 현재 세션에 제어 가능한 브라우저 인스턴스가 없어 실제 drag/click 캡처 QA는 수행하지 못했다.
- 상태·storage·trigger 동작은 hook/component 테스트와 fresh read-only diff 검토로 확인했다.
