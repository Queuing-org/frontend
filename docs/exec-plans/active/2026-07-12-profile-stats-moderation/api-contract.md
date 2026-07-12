# API Contract

## 신규 경로

- `GET /api/v1/user-profiles/{userSlug}/music-power`
- `POST /api/v1/user-profiles/{userSlug}/music-power`
- `POST /api/v1/user-profiles/{userSlug}/blocks`
- `POST /api/v1/rooms/{slug}/chat-messages/{messageKey}/reports`

모든 호출은 기존 `axiosInstance`와 `ApiResponse<T>` 처리 관례를 따른다. CSRF는 공용 Axios 계층에 맡긴다.

## 캐시

- 음악력 추천 성공: 해당 음악력 query data 갱신, 공개 사용자 프로필 query 갱신/무효화
- 차단 성공: 사용자 검색과 팔로우 관계/목록 query 무효화
- 신고 성공: 모달만 닫고 채팅 캐시는 변경하지 않음

## 불확실성

실서버 응답은 제공되지 않았다. 프로필 통계는 선택 값, 음악력 전용 응답은 `musicPower`, `targetUserSlug`, `recommendedByMe` 필수 값이라는 요청 계약을 따른다.
