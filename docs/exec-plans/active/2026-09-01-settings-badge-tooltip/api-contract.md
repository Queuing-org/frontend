# API Contract

## GET badge responses

- `GET /api/v1/user-profiles/me/badges`와 `GET /api/v1/user-profiles/{slug}/badges`는 같은 acquired badge schema를 사용한다.
- transport의 `acquisitionRate`는 OpenAPI number와 실제 예시의 numeric string을 모두 허용한다.
- 공용 mapper는 유한한 0~100 범위 값을 `number`로 정규화한다.
- 빈 문자열, 숫자가 아닌 문자열, 비유한 값, 범위 밖 값은 `null`로 정규화한다.
- 두 GET client 모두 unwrap 이후 같은 mapper를 통과한다.
- 공개 profile 조회 조건, query key, stale time, 화면 presentation은 변경하지 않는다.

## Mutation boundary

- 대표 칭호 설정은 기존 `PUT /api/v1/user-profiles/me/representative-badge`와 `{ badgeCode }` payload를 유지한다.
- 칭호 없음은 기존 DELETE mutation을 유지한다.
- mutation 성공 후 기존 badge/profile query invalidation 계약을 유지한다.
