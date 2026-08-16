# Change Summary

- 모바일 전용 홈·방 UI 기준을 `480px` 이하로 통일하고 `481px` 이상은 desktop/compact 구조를 유지했다.
- 방·친구 프로필 크기와 스크롤, 팔로우 색상, 권한 기반 presence 점 및 실시간 reconciliation을 보정했다.
- 탈퇴·차단 선택 사유의 trim/body 생략/500자 UI와 대상 변경 초기화를 구현했다.
- 중복 방 참가 실패의 잘못된 leave를 막고 STOMP 세션 교체를 방 단위 terminal cleanup에 연결했다.
- 음악력 조회·투표·query cache를 재생 건별로 전환하고 중복·pending 클릭의 추가 요청과 오류 순번 race를 막았다.
- 기존 채팅 신고, 전환 완료된 REST/204/cursor/room 삭제/채팅 삭제 동작은 유지했다.
- `dev`에 로컬 커밋만 추가했으며 push와 Draft PR #49 갱신은 수행하지 않았다.
