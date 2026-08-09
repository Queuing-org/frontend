# 변경 요약

- 방 WebSocket·mutation의 캐시 재검증을 하나의 scope scheduler로 합치고 GET 취소 신호를 API까지 전달했다.
- room socket을 route handoff에 안전한 reference-count 생명주기로 바꾸고 production STOMP debug 출력을 제거했다.
- 참가자 cursor/24-card window, 채팅 500-message window, 큐 40-card idle window, 홈 7-card stage, 검색·모바일 90-room cache, 사용자 검색에 명시적인 상한을 추가했다.
- 참가자와 방 탐색 cursor가 반복될 때 자동 pagination이 무한 GET으로 이어지지 않도록 진행 검사를 추가했다.
- 홈·검색 modal과 로고 폰트를 사용 지점으로 지연·한정하고 favicon 및 로그인 이미지를 최적화했다.
- shared→feature 역방향 의존을 정리하고 ESLint boundary를 상대경로까지 강화했다.
- 확인된 미사용 API, hook, UI, CSS, dependency와 중복 lockfile을 제거했다.
- 회귀 테스트와 repo-local 스킬 규칙을 추가해 같은 유형의 성능·캐시 문제가 다시 들어오는 경로를 막았다.
