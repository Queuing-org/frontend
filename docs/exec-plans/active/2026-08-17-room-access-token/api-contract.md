# API Contract

- 최초 `SEND /app/room/{slug}/join` body는 `{ password?: string | null }`, 재접속 body는 `{ accessToken: string }`이다.
- 현재 소켓의 `ROOM_JOINED.data`는 participant, recentChatMessages, roomAccessToken을 포함해야 한다.
- 방 이벤트·채팅 SUBSCRIBE에는 `X-Room-Access-Token` native header를 사용한다.
- playback, participants, queue-entries, queue-entries/me, chat-messages와 방 내부 mutation에는 같은 HTTP header를 사용한다.
- `GET /api/v1/rooms/{slug}` 메타는 토큰 없이 조회한다.
- `room.access-denied`는 저장 토큰을 폐기하고 비공개 방을 비밀번호 입력 흐름으로 돌린다.
- 소켓 종료만으로 토큰을 폐기하지 않는다. 명시적 leave, 강퇴, 세션 교체, 방 삭제에서는 해당 방 토큰을 폐기한다.
- 토큰은 방별 `sessionStorage`와 메모리에만 두고 URL, 로그, React Query key에는 넣지 않는다.
