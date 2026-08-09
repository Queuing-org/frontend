# API Contract

## 방장 위임

- Method: `PATCH`
- Path: `/api/v1/rooms/{slug}/owner`
- Body: `{ "userSlug": string }`
- Response: `{ "result": true }`
- 현재 방장만 현재 방에 참여 중인 다른 회원에게 위임할 수 있다.
- 게스트는 `userSlug`가 없으므로 위임 대상에서 제외한다.
- axios 공통 인증/CSRF 처리를 사용하고, room slug는 정규화 후 path segment로 인코딩한다.
- 성공 후 방장 정보와 모든 권한 판정의 원본인 `roomKeys.meta(slug)`를 무효화한다. 참가자 응답 자체에는 방장 필드가 없으므로 참가자 목록을 중복 재조회하지 않는다.

## 기존 액션 재사용

- 팔로우/언팔로우: 기존 follow mutation과 relationship cache를 사용한다.
- 신고: 대상 회원이 보낸 최신 신고 가능한 채팅 `messageKey`를 기존 채팅 신고 modal/API에 전달한다. 게스트 채팅에는 참가자 식별자가 없어 게스트 신고에는 재사용하지 않는다.
- 차단: 기존 `BlockUserModal`과 block mutation을 사용한다.
- 내보내기: 회원은 `userSlug`, 게스트는 `participantId`를 기존 kick mutation에 전달한다.
