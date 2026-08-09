# API 계약

## 사용자 프로필

- `GET /api/v1/user-profiles/me`
- 응답의 `listeningDurationSeconds`는 누적 이용 시간이며 초 단위 정수다.
- 방 내부 공개 프로필에도 같은 필드가 전달될 때 동일한 포매터를 적용하고, 누락 시 `-`를 표시한다.

## 방 목록·검색

- `GET /api/v1/rooms`
- 선택 태그가 있을 때만 `tags=slug-a,slug-b` 형식으로 보낸다.
- 태그는 공백·빈 값·중복을 제거한 뒤 최대 3개를 유지하고, 안정적인 쿼리 키를 위해 정렬한다.
- 커서 기반 다음 페이지에도 동일한 태그 조건을 유지한다.

## 주소

- REST: `https://api.queuing.cc`
- STOMP: `wss://api.queuing.cc/ws`
- 로컬 프론트: `https://local.queuing.cc:3000`
