# Request Summary

## Request

기존의 방 생성 완료 후 썸네일 업로드 방식을 파일 선택 즉시 임시 업로드하는 방식으로 변경한다. 제공된 `POST /api/v2/rooms/thumbnail` 계약을 사용하고, 성공 응답의 `uploadToken`을 방 생성 요청의 `thumbnailUploadToken`으로 전달한다. 업로드 실패는 사용자가 다음 단계로 넘어가기 전에 UI에서 즉시 확인할 수 있어야 한다.

## API Evidence

- Request: `multipart/form-data`, `file` 필수
- Success: `201`, `result.uploadToken`, `result.thumbnailUrl`, 해상도별 URL과 메타데이터
- Expected failures: `400`, `401`, `403`, `409`
- `409` business code: `room.thumbnail-upload-limit-exceeded`
- Authentication: session cookie와 CSRF header는 공유 `axiosInstance`가 담당

## Non-goals

- 기존 방 수정용 썸네일 PUT 계약 변경
- 임시 업로드 취소/삭제 API 추가
- 백엔드 만료 정책 변경
