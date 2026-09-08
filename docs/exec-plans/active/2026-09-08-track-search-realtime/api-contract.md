# API 계약

2026-09-08 GitHub API로 Queuing-org/backend main의 Controller/Response 원문 확인.

- `src/main/java/queuing/core/room/queue/presentation/controller/UserFrequentlyQueuedTrackController.java`
- `src/main/java/queuing/core/room/queue/presentation/controller/YoutubeVideoSearchController.java`
- 같은 queue 패키지 `presentation/response/FrequentlyQueuedTrackResponse.java`, `YoutubeVideoSearchResponse.java`
- `room/participant/application/event/payload/RoomParticipantNicknameChangedEventData.java`

## 검색
- GET `/api/v1/user-profiles/me/frequent-tracks`: 로그인 쿠키, 파라미터 없음. 현재 보관 재생 기록 기반 신청 횟수/최근 신청 순 최대 8개. provider/videoId/title/thumbnailUrl(nullable)/durationMs/requestCount.
- GET `/api/v1/youtube/videos?query=…&size=8`: 로그인 쿠키. trim 후 1~100자. videoId/title/channelTitle/thumbnailUrl/durationMs. 새 요청은 cursor 생략.
- 두 응답 모두 기존 `{ result: { items, hasNext: false, nextCursor: null } }` 계약. UI에서 8개로 상한을 한 번 더 적용.
- quota: HTTP 503, code `room.youtube-api-quota-exceeded`. Query 자동 retry/focus/reconnect 재조회 비활성. HTTP 429는 공유 Axios의 기존 Retry-After/최대 2회 정책을 유지.
- `AbortSignal`을 두 GET으로 전달. 로그인 계정 slug를 query key에 포함. 로그아웃/탈퇴는 진행 중 me 조회 취소 후 me null 및 검색 캐시 삭제.
- frequent staleTime 30초, YouTube staleTime 5분. 신청 결과/재생 기록 리셋 시 frequent 무효화.

## 실시간 이름
- 기존 room topic의 `ROOM_PARTICIPANT_NICKNAME_CHANGED`, roomSlug/timestamp/data.userSlug/data.nickname.
- 유한한 양수 timestamp, 정확한 현재 방, 비어 있지 않은 slug/nickname 검증. 동일 user timestamp <= 최신 이벤트는 무시.
- 참가자 전체 페이지, 개인/전체 큐, 현재 곡, 방장, 해당 프로필, me 이름만 패치. 재검증 결과에도 방 세션 최신 이름을 적용.
- 서버 조회에는 닉네임 버전이 없으므로 세션이 수신한 이벤트를 우선. 재연결 중 놓친 새 이벤트와 오래된 REST 응답을 완전히 구분할 수 없는 서버 계약상 한계가 있음.
- 채팅은 저장된 원문을 변경하지 않고 표시 배열에서만 senderSlug로 이름을 보정. 사용자별 추가 조회 없음.
