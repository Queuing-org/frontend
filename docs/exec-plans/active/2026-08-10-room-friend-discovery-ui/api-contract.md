# API Contract

Backend endpoint, request payload, response type 변경 없음.

- `ApiError.status`와 `ApiError.code`는 API/hook 내부 분기에 그대로 남긴다.
- 썸네일 임시 업로드, 방 생성, 방 수정, 프로필 수정 UI는 문맥 prefix와 `ApiError.message`만 렌더링한다.
- follow/unfollow mutation은 기존 `followKeys.all()`과 user search root 무효화를 유지한다.
- block mutation은 기존 `followKeys.all()`과 user search root 무효화를 유지하며, 상세 dialog close는 UI callback으로만 처리한다.
