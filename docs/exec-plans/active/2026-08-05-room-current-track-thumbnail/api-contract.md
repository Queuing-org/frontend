# API Contract

## 방 썸네일

- 방 목록과 `GET /api/v1/rooms/{slug}`의 `thumbnailUrl`/`thumbnailUrls`는 현재 재생 중인 곡의 썸네일을 나타낸다.
- 서버 썸네일이 있으면 해상도별 `thumbnailUrls` 우선순위에 따라 표시한다.
- 서버 썸네일이 모두 `null`이거나 빈 값이면 방은 존재하지만 현재 재생 중인 곡이 없는 상태로 보고 로컬 단일 fallback을 표시한다.

## 실시간 재검증

- `TRACK_STARTED`: playback/queue와 함께 `roomKeys.meta(roomSlug)`를 무효화한다.
- `TRACK_ENDED`: playback/queue와 함께 `roomKeys.meta(roomSlug)`를 무효화해 다음 곡 이미지 또는 빈 방 fallback으로 전환한다.
- 시간 기반 polling은 추가하지 않는다.
