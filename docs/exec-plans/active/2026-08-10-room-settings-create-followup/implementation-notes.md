# Implementation Notes

- 방 시각 변경은 기존 room profile/chat/queue CSS Modules 안에 한정했다. 열린 채팅 관리 row의 `z-index: 10`은 fade layer의 `z-index: 5`보다 높게 유지했다.
- 프로필 payload 조합과 submitted-field feedback timer는 `useProfileSettingsForm`이 소유한다. feedback attribute는 정확히 2,000ms에 제거하고 CSS border-color transition을 두지 않았다.
- 프로필 저장 중 칭호 select를 비활성화해 `useUpdateMe().reset()`이 active mutation observer를 분리하는 race를 차단했다.
- 칭호 mutation은 기존처럼 select change 즉시 실행하며 같은 고정 feedback 영역에서 프로필 상태보다 최근 칭호 상태를 우선한다.
- 참여 제한은 실제 동작에 맞는 disclosure와 pressed option buttons로 표현했다. 메뉴 열림만 `CreateSettingsStep` local state이고 password/mode/max participants는 modal parent state다.
- 생성 단계 이동은 next, previous, sidebar, validation redirect 모두 `visitStep`을 거쳐 `furthestVisitedStep`을 단조 증가시킨다.
- API client와 공용 payload type은 변경하지 않았다.
- in-app browser 연결을 시도했으나 available browser 목록이 비어 있어 실제 시각 QA를 수행하지 못했다.
