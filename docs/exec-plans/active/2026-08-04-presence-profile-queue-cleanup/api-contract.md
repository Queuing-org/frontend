# API Contract

## Follow Presence

- 기존 follow list의 `online`, 공개 `room`, `presenceVersion`과 전역 STOMP 이벤트를 그대로 사용한다.
- 새 REST 요청이나 별도 사용자별 presence 조회를 추가하지 않는다.

## Music Power

- 현재 곡 신청자 평가는 `PUT /api/v1/rooms/{roomSlug}/current-track/music-power` body `{ vote }`만 UI에서 사용한다.
- `myVote`는 응답/실시간 cache 계약에는 남지만 선택 상태나 DELETE 취소에 사용하지 않는다.
- 1시간 제한은 서버 오류 메시지를 그대로 표시하고 클라이언트 쿨다운을 만들지 않는다.

## Representative Badge

- 설정: `PUT /api/v1/users/me/badges/representative` body `{ badgeCode }`
- 해제: `DELETE /api/v1/users/me/badges/representative`, response `{ result: true }`
- 성공 시 `badgeKeys.me`, `userKeys.me`, 로그인 사용자의 공개 badge 및 공개 profile query를 무효화한다.

## Blocked Users

- 목록: `GET /api/v1/user-profiles/me/blocks?size=20`, 다음 페이지는 `lastId={nextCursor}&size=20`을 보낸다.
- 응답: `items`, `hasNext`, `nextCursor`; 항목은 `slug`, `cursorId`, `nickname`, `blockedAt`, `profileImageUrl`을 사용한다.
- 해제: `DELETE /api/v1/user-profiles/{userSlug}/blocks`, `{ result: true }`를 검증한다.
- 차단/해제 성공 시 blocked 목록, follower/following 목록, 사용자 검색 cache를 재검증한다.
