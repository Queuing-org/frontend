# API Contract

## Temporary Upload

- Method/path: `POST /api/v2/rooms/thumbnail`
- Content type: browser가 boundary를 설정하는 `FormData`
- Field: `file`
- Response envelope: `ApiResponse<RoomThumbnailTemporaryUploadResult>`
- Required result used by UI: `uploadToken`, `thumbnailUrl`
- Additional metadata: `width`, `height`, `expiresAt`, `sizeBytes`, `contentType`, `thumbnailUrls`

## Room Creation

- Existing endpoint: `POST /api/v1/rooms`
- New optional payload field: `thumbnailUploadToken`
- Token source: the latest successful temporary upload in the open create modal

## Cache

- 임시 업로드는 아직 방 목록/메타를 변경하지 않으므로 invalidate하지 않는다.
- 방 생성 성공은 기존 `roomKeys.all()` invalidate를 유지한다.
- 기존 방 수정 썸네일 PUT은 현재 방 목록과 메타 invalidate를 유지한다.

## Failure Path

- API 오류는 `ApiError`로 mutation에 전달한다.
- 모달은 파일 입력 근처에 상태 코드와 서버 메시지를 즉시 표시한다.
- 오류가 남아 있는 동안 다음 단계 이동을 막는다.
- 파일 재선택은 이전 mutation 상태를 reset하고 새 업로드를 시작한다.
