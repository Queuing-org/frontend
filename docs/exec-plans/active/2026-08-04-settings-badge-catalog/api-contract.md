# API Contract

## GET /api/v1/users/me/badges

- 인증된 사용자가 획득했고 현재 사용할 수 있는 칭호만 반환한다.
- 설정 칭호 옵션은 `result.badges`만 사용한다.
- 현재 선택값은 `result.representativeBadge`를 우선 사용하고, 없으면 `badges[].representative`에서 찾는다.
- 설정 화면에서는 공개 카탈로그 `GET /api/v1/badges`와 획득 목록을 합치지 않는다.

## PATCH /api/v1/user-profiles/me

- request:
  - `nickname`: required, 2~20자
  - `statusMessage`: optional nullable string, 최대 255자, 줄바꿈 금지
  - 빈 문자열 `statusMessage`는 삭제 의도다.
- response: `result: boolean`
- 한 줄 메시지만 수정해도 현재 서버 닉네임을 함께 보낸다.
- boolean 응답을 사용자 캐시로 저장하지 않는다.
- 성공 후 `userKeys.me()`와 현재 slug의 `userKeys.profile(slug)`를 재검증한다.

## Account Cache Boundary

- `badgeKeys.me()`는 사용자 slug 비스코프이므로 로그아웃 성공 시 제거한다.
