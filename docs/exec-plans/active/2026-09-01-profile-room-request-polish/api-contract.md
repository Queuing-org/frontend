# API Contract

- `PATCH /api/v1/user-profiles/me`의 기존 `statusMessage` 필드와 payload 형태를 그대로 사용한다.
- 최애곡 입력은 줄바꿈을 공백으로 정규화한 뒤 최대 40자까지만 전송한다.
- 방 수정과 노래 신청 endpoint, payload, cache invalidation에는 변경이 없다.
- `https://api.queuing.cc`의 일반적인 OpenAPI/Swagger 공개 경로는 2026-09-01 확인 시 모두 404였다. 따라서 새 서버 최대 길이를 추정해 타입을 바꾸지 않고, 기존 255자 프런트 계약보다 보수적인 40자 제한만 적용한다.
