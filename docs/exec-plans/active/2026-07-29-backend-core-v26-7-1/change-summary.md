# Change Summary

- backend-core v26.7.1 음악력과 칭호 계약을 전환했다.
- 방의 단일 state 조회를 playback/participants/queue/history query로 분리하고 cursor 계약을 적용했다.
- 상태 메시지, 팔로우 presence, 지난 곡 UI를 추가했다.
- 앱 범위 badge SSE와 방/팔로우 STOMP 캐시 동기화를 추가했다.
- 제거된 방 썸네일 편집, 검색 통계, 지역 제한 필드를 정리했다.
- GET 429의 서버 지시 대기와 제한된 재시도 정책을 추가했다.

기능 커밋:

- `3d46756` `feat(api): v26.7.1 REST 계약과 재시도 정책 반영`
- `45067d3` `feat(profile): 상태 메시지와 팔로우 접속 상태 반영`
- `6e5801e` `feat(room): 음악력 투표와 분리된 방 데이터 UI 적용`
- `2b8325b` `feat(realtime): 칭호 SSE와 방 이벤트 캐시 동기화`
