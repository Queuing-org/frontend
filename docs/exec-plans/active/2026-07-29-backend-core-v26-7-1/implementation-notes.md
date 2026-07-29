# Implementation Notes

## API And Cache

- 음악력 계약을 `UPVOTE | DOWNVOTE | null`로 통일하고 사용자/현재 곡 신청자 PUT·DELETE API와 캐시 동기화를 추가했다.
- 투표 응답은 음악력 query, 공개 프로필, 로그인 사용자 캐시를 즉시 갱신하고 공개 프로필을 재검증한다.
- 칭호 API와 UI 식별자를 `badgeCode`로 전환하고 카탈로그/획득 응답 필드를 분리했다.
- `/state`를 playback, participants, playlist, playlist/me로 분리했다.
- 큐는 첫 요청 `size=100`, 후속 요청 `cursor + queueRevision`을 사용하고 conflict 시 전체 조회를 한 번만 재시작한다.
- participants는 모든 cursor 페이지를 합치고 history는 `cursorId` infinite query로 제공한다.
- Axios에서 GET 429만 최대 두 번 재시도하며 `Retry-After`와 지수 백오프 중 긴 값을 사용한다. React Query의 중복 재시도는 끊었다.

## UI And Realtime

- 음악력 버튼은 UP/DOWN/같은 방향 취소 상태를 제공하며 본인·게스트·비로그인·로딩 중에는 표시한 채 비활성화한다.
- 프로필 상태 메시지는 단일 행 255자 제한, 빈 문자열 삭제, 미수정 필드 생략 규칙을 적용했다.
- follower/following 카드에 온라인 상태와 공개 방 링크를 추가하고, 더 최신 `presenceVersion` 이벤트만 양쪽 캐시에 반영한다.
- 지난 곡 탭은 재생/스킵 상태, 시간, 신청자와 명시적 `더 보기` 페이지네이션을 제공한다.
- 로그인 사용자 범위에서 칭호 EventSource를 한 번 열고 이벤트 ID와 badgeCode로 중복 제거한 뒤 모달을 순차 표시한다.
- 방 WebSocket은 runtime guard를 통과한 음악력/트랙 시작 이벤트만 즉시 캐시에 반영한다. 재연결은 기존 구독을 해제한 뒤 하나만 복원하고 방 조회를 재검증한다.

## Removed

- 기존 방 썸네일 PUT/DELETE API, 훅, 편집 입력
- `/state` query와 기존 playlist query
- 검색 결과의 `musicPower`, `queuingCount`
- `QueueEntry.track.regionRestriction`
- RECOMMEND/DISRECOMMEND 음악력 계약
